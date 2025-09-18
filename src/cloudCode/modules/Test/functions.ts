import Test from '../../models/Test';
import {CloudFunction} from '../../utils/Registry/decorators';

class soso {
  @CloudFunction({methods: ['GET']})
  async getTestsss(req: Parse.Cloud.FunctionRequest) {
    const sessionToken = req.user?.getSessionToken();
    const results = await new Parse.Query(Test).find({
      sessionToken,
    });
    return results;
  }

  @CloudFunction({methods: ['GET']})
  async getTestsBySpecialization(req: Parse.Cloud.FunctionRequest) {
    const roleQuery = new Parse.Query('_Role');
    const testQuery = new Parse.Query('Test');
    testQuery.doesNotMatchKeyInQuery('createdAt', 'createdAt', roleQuery);
    const results = await testQuery.find();
    return results;
  }

  @CloudFunction({methods: ['GET'], requiresAuth: true})
  async hiTest(req: Parse.Cloud.FunctionRequest) {
    const results = await new Parse.Query(Test).withCount(true).find();
    return results;
  }

  @CloudFunction({methods: ['POST']})
  async addTest(req: Parse.Cloud.FunctionRequest) {
    const body = req.params;
    const results = new Test();
    results.name = body.name;
    results.specialization = body.specialization;
    return await results.save();
  }

  @CloudFunction({methods: ['GET']})
  async forceCreateEmployee(req: Parse.Cloud.FunctionRequest) {
    const obj = new Parse.Object('Employee');
    obj.set('name', 'Temp');
    obj.set('position', 'Tester');
    obj.set('department', 'QA');
    obj.set('hiredAt', new Date());
    return await obj.save(null, {useMasterKey: true});
  }

  @CloudFunction({methods: ['GET']})
  async getTestsLinkedToQAEmployees(req: Parse.Cloud.FunctionRequest) {
    const employeeQuery = new Parse.Query('Employee');
    employeeQuery.equalTo('department', 'QA');

    const testQuery = new Parse.Query('Test');
    testQuery.matchesQuery('employee', employeeQuery);

    const results = await testQuery.find();
    return results;
  }
  @CloudFunction({methods: ['POST']})
  async addLinkedTest(req: Parse.Cloud.FunctionRequest) {
    const body = req.params;

    const employeePointer = {
      __type: 'Pointer',
      className: 'Employee',
      objectId: body.employeeId,
    };

    const test = new Parse.Object('Test');
    test.set('name', body.name);
    test.set('specialization', body.specialization);
    test.set('employee', employeePointer);

    return await test.save(null, {useMasterKey: true});
  }
  @CloudFunction({methods: ['POST']})
  async addTestWithQuestion(req: Parse.Cloud.FunctionRequest) {
    const body = req.params;

    const test = new Test();
    test.name = body.name;
    test.specialization = body.specialization || 'general';
    test.question = body.question;

    return await test.save();
  }
  @CloudFunction({methods: ['GET']})
  async searchTestsByKeyword(req: Parse.Cloud.FunctionRequest) {
    const keyword = req.params.keyword || 'JavaScript';

    const query = new Parse.Query('Test');
    query.fullText('question', keyword);

    const results = await query.find();
    return results;
  }
  @CloudFunction({methods: ['GET']})
  async getTestsWithEmployeeDetails(req: Parse.Cloud.FunctionRequest) {
    const query = new Parse.Query('Test');
    query.include('employee');

    const results = await query.find();
    return results;
  }
  @CloudFunction({methods: ['GET']})
  async getTests(req: Parse.Cloud.FunctionRequest) {
    const employeeQuery = new Parse.Query('Employee');
    employeeQuery.equalTo('department', 'QA');

    const testQuery = new Parse.Query('Test');
    testQuery.matchesQuery('employee', employeeQuery);
    testQuery.include('employee');

    const results = await testQuery.find();
    return results;
  }
  @CloudFunction({methods: ['GET']})
  async searchTests(req: Parse.Cloud.FunctionRequest) {
    const keyword = req.params.keyword || 'JavaScript';

    const employeeQuery = new Parse.Query('Employee');
    employeeQuery.equalTo('department', 'Engineering');

    const testQuery = new Parse.Query('Test');
    testQuery.fullText('question', keyword);
    testQuery.matchesQuery('employee', employeeQuery);

    const results = await testQuery.find();
    return results;
  }

  @CloudFunction({methods: ['GET']})
  async Test2(req: Parse.Cloud.FunctionRequest) {
    const keyword = req.params.keyword || 'JavaScript';
    const allowedSkills = ['TypeScript', 'Node.js', 'Parse'];

    const employeeQuery = new Parse.Query('Employee');
    employeeQuery.equalTo('department', 'Engineering');
    employeeQuery.exists('skills');
    employeeQuery.containedBy('skills', allowedSkills);

    const testQuery = new Parse.Query('Test');
    testQuery.fullText('question', keyword);
    testQuery.matchesQuery('employee', employeeQuery);
    testQuery.greaterThan('createdAt', new Date('2024-01-01'));

    const results = await testQuery.find();
    return results;
  }
  @CloudFunction({methods: ['GET']})
  async Test22(req: Parse.Cloud.FunctionRequest) {
    const keywordQuery = new Parse.Query('Test');
    keywordQuery.fullText('question', 'JavaScript');

    const employeeQuery = new Parse.Query('Employee');
    employeeQuery.equalTo('department', 'QA');

    const testQuery = new Parse.Query('Test');
    testQuery.matchesQuery('employee', employeeQuery);

    const finalQuery = Parse.Query.or(keywordQuery, testQuery);

    return finalQuery
      .find()
      .then(function (results) {
        return results;
      })
      .catch(function (error) {
        throw error;
      });
  }
  @CloudFunction({methods: ['GET']})
  async getTestCountsBySpecialization(req: Parse.Cloud.FunctionRequest) {
    const pipeline: any[] = [
      {
        $group: {
          _id: '$specialization',
          count: {$sum: 1},
        },
      },
      {
        $sort: {count: -1},
      },
    ];

    const results = await new Parse.Query('Test').aggregate(pipeline);
    return results;
  }
  @CloudFunction({methods: ['GET']})
  async testRevertExample(req: Parse.Cloud.FunctionRequest) {
    const query = new Parse.Query('Test');
    const test = await query.first();

    if (!test) {
      throw new Error('No Test object found');
    }

    const originalName = test.get('name');

    test.set('name', 'Temporary Change');

    const localName = test.get('name');

    test.revert();

    const revertedName = test.get('name');

    return {
      originalName,
      localName,
      revertedName,
    };
  }
}
export default soso;

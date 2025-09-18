import { count } from 'console';
import Employee from '../../models/Employee';
import {CloudFunction} from '../../utils/Registry/decorators';

class EmployeeFunctions {
  @CloudFunction({ methods: ['POST'] })
  async addEmployee(req: Parse.Cloud.FunctionRequest) {
    const body = req.params;
    const emp = new Employee();
    emp.name = body.name;
    emp.position = body.position;
    emp.department = body.department;
    emp.hiredAt = new Date(body.hiredAt);
    emp.skills = body.skills || [];
    return await emp.save();
  }


  @CloudFunction({ methods: ['GET'] })
  async EmpTest(req: Parse.Cloud.FunctionRequest) {
    const query = new Parse.Query(Employee);
    query.containedIn("name", ["Yara", "Lu"]);
    const results = await query.find();
    return results;
  }

  @CloudFunction({ methods: ['GET'] })
  async getEmployeesLinkedToMathTests(req: Parse.Cloud.FunctionRequest) {
    const testQuery = new Parse.Query('Test');
    testQuery.startsWith('name', 'Math');

    const employeeQuery = new Parse.Query('Employee');
    employeeQuery.matchesQuery('test', testQuery);

    const results = await employeeQuery.find();
    return results;
  }
  @CloudFunction({ methods: ['GET'] })
async getEmployeesWithNamesInRecentTests(req: Parse.Cloud.FunctionRequest) {
  const testQuery = new Parse.Query('Test');
  testQuery.greaterThan('createdAt', new Date('2024-01-01'));
  testQuery.select('name');

  const employeeQuery = new Parse.Query('Employee');
  employeeQuery.select('name');
  employeeQuery.matchesKeyInQuery('name', 'name', testQuery);

  const results = await employeeQuery.find();
  return results;
}
@CloudFunction({ methods: ['GET'] })
  async getEmployeesWithApprovedSkills(req: Parse.Cloud.FunctionRequest) {
    const allowedSkills = ['TypeScript', 'Node.js', 'Parse'];

    const query = new Parse.Query('Employee');
    query.exists('skills');
    query.containedBy('skills', allowedSkills);
    const results = await query.find();
    const filtered = results.filter((emp: any) => {
      const skills = emp.get('skills');
      return Array.isArray(skills) &&
        skills.every((skill: string) => allowedSkills.includes(skill));
    }
  );
    return filtered;
  }
  @CloudFunction({ methods: ['GET'] })
async getEmployeesByDepartments(req: Parse.Cloud.FunctionRequest) {
  const query = new Parse.Query('Employee');
  query.containedIn('department', ['QA', 'Engineering']);
  return await query.find();
}
@CloudFunction({ methods: ['GET'] })
async getEmployeesSkills(req: Parse.Cloud.FunctionRequest) {
  const testQuery = new Parse.Query('Test');
  testQuery.greaterThan('createdAt', new Date('2024-01-01'));
  testQuery.select('name');

  const allowedSkills = ['TypeScript', 'Node.js', 'Parse'];

  const query = new Parse.Query('Employee');
  query.exists('skills');
  query.select('name');
  query.matchesKeyInQuery('name', 'name', testQuery);
  query.containedBy('skills', allowedSkills);

  const results = await query.find();

  const filtered = results.filter((emp: any) => {
    const skills = emp.get('skills');
    return Array.isArray(skills) &&
      skills.every((skill: string) => allowedSkills.includes(skill));
  });

  return filtered;
}
@CloudFunction({ methods: ['GET'] })
async getEmployeeCountsByDepartment(req: Parse.Cloud.FunctionRequest) {
  const pipeline: any[] = [
    {
      $group: {
        _id: '$department',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ];

  const results = await new Parse.Query('Employee').aggregate(pipeline);
  return results;
}
@CloudFunction({ methods: ['GET'] })
async getbyDate(req: Parse.Cloud.FunctionRequest) {
  const pipeline: any[] = [
    {
      $match: {
        hiredAt: { $gte: new Date('2024-01-01') }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$hiredAt" } },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ];

  const results = await new Parse.Query('Employee').aggregate(pipeline);
  return results;
}
@CloudFunction({ methods: ['GET'] })
async getQAEmployees(req: Parse.Cloud.FunctionRequest) {
  const query = new Parse.Query(Employee);
  query.equalTo('department', 'QA');
  query.select(['name', 'department']);

  const results = await query.find();
  return results;
}

@CloudFunction({ methods: ['GET'] })
async getUniqueDepartments(req: Parse.Cloud.FunctionRequest) {
  const query = new Parse.Query('Employee');

  return query.distinct('department')
    .then((departments) => {
      return departments;
    })
    .catch((error) => {
      throw error;
    });
}


}
export default EmployeeFunctions;

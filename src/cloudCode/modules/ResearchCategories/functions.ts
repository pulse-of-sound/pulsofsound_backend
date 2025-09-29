import {CloudFunction} from '../../utils/Registry/decorators';
import ResearchCategories from '../../models/ResearchCategories';

class ResearchCategoriesFunctions {
  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: false,
      fields: {
        name: {type: String, required: true},
      },
    },
  })
  async createResearchCategory(req: Parse.Cloud.FunctionRequest) {
    const user = req.user;
    if (!user) throw new Error('User is not logged in');

    const role = await user.get('role')?.fetch({useMasterKey: true});
    if (!role || role.get('name') !== 'Admin') {
      throw {code: 403, message: 'Only admins can add categories'};
    }

    const {name} = req.params;
    const category = new ResearchCategories();
    category.set('name', name);
    category.set('created_at', new Date());
    category.set('updated_at', new Date());

    await category.save(null, {useMasterKey: true});
    return {
      message: 'The category was created successfully.',
      category_id: category.id,
    };
  }
  @CloudFunction({
    methods: ['GET'],
    validation: {
      requireUser: true,
    },
  })
  async getAllResearchCategories(req: Parse.Cloud.FunctionRequest) {
    const query = new Parse.Query(ResearchCategories);
    query.ascending('name');
    const categories = await query.find({useMasterKey: true});

    return categories.map(cat => ({
      category_id: cat.id,
      name: cat.get('name'),
      created_at: cat.get('created_at'),
      updated_at: cat.get('updated_at'),
    }));
  }
}

export default new ResearchCategoriesFunctions();

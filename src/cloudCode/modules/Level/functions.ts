import {CloudFunction} from '../../utils/Registry/decorators';
import Level from '../../models/Level';
import LevelGame from '../../models/LevelGame';
import ChildLevel from '../../models/ChildLevel';
import ChildProfile from '../../models/ChildProfile';
// import LevelGame from '../../models/LevelGame';

class LevelFunctions {
  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: false,
      fields: {
        name: {required: true, type: String},
        description: {required: false, type: String},
        order: {required: true, type: Number},
      },
    },
  })
  async addLevelByAdmin(req: Parse.Cloud.FunctionRequest) {
    try {
      const {name, description, order} = req.params;

      const existing = await new Parse.Query(Level)
        .equalTo('order', order)
        .first({useMasterKey: true});

      if (existing) {
        throw {
          codeStatus: 101,
          message: 'Level with this order already exists',
        };
      }

      const level = new Level();
      level.set('name', name);
      level.set('description', description || '');
      level.set('order', order);
      level.set('created_at', new Date());
      level.set('updated_at', new Date());

      await level.save(null, {useMasterKey: true});

      return {
        message: 'Level added successfully',
        level: level.toJSON(),
      };
    } catch (error: any) {
      console.error('Error in addLevelByAdmin:', error);
      throw {
        codeStatus: error.codeStatus || 1000,
        message: error.message || 'Failed to add level',
      };
    }
  }

  @CloudFunction({
    methods: ['GET'],
    validation: {
      requireUser: false,
      fields: {},
    },
  })
  async getAllLevels(req: Parse.Cloud.FunctionRequest) {
    const query = new Parse.Query(Level);
    query.ascending('order');

    const results = await query.find({useMasterKey: true});

    const levels = results.map(level => ({
      objectId: level.id,
      name: level.get('name'),
      description: level.get('description'),
      order: level.get('order'),
    }));

    return {
      message: 'All levels fetched successfully',
      levels,
    };
  }

  @CloudFunction({
    methods: ['GET'],
    validation: {
      requireUser: false,
      fields: {
        child_id: {type: String, required: true},
      },
    },
  })
  async getCurrentStageForChild(req: Parse.Cloud.FunctionRequest) {
    try {
      const {child_id} = req.params;
      const user = req.user;

      if (!user) {
        throw {codeStatus: 401, message: 'Unauthorized: user not found'};
      }

      const childProfile = await new Parse.Query(ChildProfile)
        .equalTo('objectId', child_id)
        .include('parent_id')
        .first({useMasterKey: true});

      if (!childProfile) {
        throw {codeStatus: 404, message: 'Child profile not found'};
      }

      const parent = childProfile.get('parent_id');
      const directUser = childProfile.get('user');

      const isChild = user.id === child_id;
      const isParent =
        (parent && user.id === parent.id) ||
        (directUser && user.id === directUser.id);

      if (!isChild && !isParent) {
        throw {codeStatus: 403, message: 'Access denied: not child or parent'};
      }

      if (!isChild && !isParent) {
        throw {codeStatus: 403, message: 'Access denied: not child or parent'};
      }

      const childLevelQuery = new Parse.Query(ChildLevel);
      childLevelQuery.equalTo('child_id', childProfile);
      childLevelQuery.include('level_id');
      const childLevel = await childLevelQuery.first({useMasterKey: true});

      if (!childLevel) {
        throw {codeStatus: 404, message: 'Child level not found'};
      }

      const level = childLevel.get('level_id');
      const currentOrder = childLevel.get('current_game_order');

      if (!level || currentOrder === undefined) {
        throw {codeStatus: 400, message: 'Invalid level or game order'};
      }

      const gameQuery = new Parse.Query(LevelGame);
      gameQuery.equalTo('level_id', level);
      gameQuery.equalTo('order', currentOrder);
      const currentStage = await gameQuery.first({useMasterKey: true});

      if (!currentStage) {
        throw {codeStatus: 404, message: 'Current stage not found'};
      }

      return {
        message: 'Current stage fetched successfully',
        stage: {
          objectId: currentStage.id,
          title: currentStage.get('title'),
          order: currentStage.get('order'),
          level_id: level.id,
        },
      };
    } catch (error: any) {
      console.error('Error in getCurrentStageForChild:', error);
      throw {
        codeStatus: error.codeStatus || 1001,
        message: error.message || 'Failed to fetch current stage',
      };
    }
  }
}

export default new LevelFunctions();

import {CloudFunction} from '../../utils/Registry/decorators';
import AppointmentPlan from '../../models/AppointmentPlan';

class AppointmentPlanFunctions {
  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: true,
      fields: {
        title: {type: String, required: true},
        duration_minutes: {type: Number, required: true},
        price: {type: Number, required: true},
        description: {type: String, required: false},
      },
    },
  })
  async createAppointmentPlan(req: Parse.Cloud.FunctionRequest) {
    try {
      const user = req.user;
      if (!user) {
        throw {codeStatus: 103, message: 'User context is missing'};
      }

      const rolePointer = user.get('role');
      const role = await new Parse.Query(Parse.Role)
        .equalTo('objectId', rolePointer?.id)
        .first({useMasterKey: true});

      const roleName = role?.get('name');
      if (roleName !== 'Admin') {
        throw {codeStatus: 102, message: 'User is not authorized to create plans'};
      }

      const {title, duration_minutes, price, description} = req.params;

      const plan = new AppointmentPlan();
      plan.set('title', title);
      plan.set('duration_minutes', duration_minutes);
      plan.set('price', price);
      plan.set('description', description || '');
      plan.set('created_at', new Date());
      plan.set('updated_at', new Date());

      await plan.save(null, {useMasterKey: true});

      return {
        message: 'Appointment plan created successfully',
        appointmentPlan: plan.toJSON(),
      };
    } catch (error: any) {
      console.error('Error in createAppointmentPlan:', error);
      throw {
        codeStatus: error.codeStatus || 1001,
        message: error.message || 'Failed to create appointment plan',
      };
    }
  }

  @CloudFunction({
    methods: ['GET'],
    validation: {
      requireUser: true,
      fields: {},
    },
  })
  async getAvailableAppointmentPlans(req: Parse.Cloud.FunctionRequest) {
    try {
      const user = req.user;
      if (!user) {
        throw {codeStatus: 103, message: 'User context is missing'};
      }

      const query = new Parse.Query(AppointmentPlan);
      query.ascending('created_at');
      const plans = await query.find({useMasterKey: true});

      const formatted = plans.map(plan => ({
        id: plan.id,
        title: plan.get('title'),
        duration_minutes: plan.get('duration_minutes'),
        price: plan.get('price'),
        description: plan.get('description'),
      }));

      return formatted;
    } catch (error: any) {
      console.error('Error in getAvailableAppointmentPlans:', error);
      throw {
        codeStatus: error.codeStatus || 1002,
        message: error.message || 'Failed to retrieve appointment plans',
      };
    }
  }
}

export default new AppointmentPlanFunctions();

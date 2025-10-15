import {CloudFunction} from '../../utils/Registry/decorators';
import Appointment from '../../models/Appointment';
import AppointmentPlan from '../../models/AppointmentPlan';
import Invoice from '../../models/Invoice';

class AppointmentFunctions {
  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: true,
      fields: {
        child_id: {type: String, required: true},
        provider_id: {type: String, required: true},
        appointment_plan_id: {type: String, required: true},
        note: {type: String, required: false},
      },
    },
  })
  async requestPsychologistAppointment(req: Parse.Cloud.FunctionRequest) {
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
      if (roleName !== 'Parent' && roleName !== 'Child') {
        throw {
          codeStatus: 102,
          message: 'Only parents or children can request appointments',
        };
      }

      const {child_id, provider_id, appointment_plan_id, note} = req.params;

      const plan = await new Parse.Query(AppointmentPlan)
        .equalTo('objectId', appointment_plan_id)
        .first({useMasterKey: true});
      if (!plan) {
        throw {codeStatus: 104, message: 'Appointment plan not found'};
      }

      const appointment = new Appointment();
      appointment.set('user_id', user);
      appointment.set('provider_id', new Parse.User({id: provider_id}));
      appointment.set(
        'child_id',
        new Parse.Object('ChildProfile', {id: child_id})
      );
      appointment.set('appointment_plan_id', plan);
      appointment.set('note', note || '');
      appointment.set('status', 'pending');
      appointment.set('created_at', new Date());
      appointment.set('updated_at', new Date());
      await appointment.save(null, {useMasterKey: true});

      const invoice = new Invoice();
      invoice.set('appointment_id', appointment);
      invoice.set('amount', plan.get('price'));
      invoice.set('status', 'pending');
      invoice.set('created_at', new Date());
      invoice.set('updated_at', new Date());
      await invoice.save(null, {useMasterKey: true});

      return {
        message: 'Appointment request submitted successfully',
        appointment: appointment.toJSON(),
        invoice: invoice.toJSON(),
      };
    } catch (error: any) {
      console.error('Error in requestPsychologistAppointment:', error);
      throw {
        codeStatus: error.codeStatus || 1003,
        message: error.message || 'Failed to request appointment',
      };
    }
  }
  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: true,
      fields: {
        child_id: {type: String, required: true},
      },
    },
  })
  async getChildAppointments(req: Parse.Cloud.FunctionRequest) {
    try {
      const user = req.user;
      if (!user) {
        throw {codeStatus: 103, message: 'User context is missing'};
      }

      const {child_id} = req.params;

      const query = new Parse.Query(Appointment);
      query.equalTo(
        'child_id',
        new Parse.Object('ChildProfile', {id: child_id})
      );
      query.include(['appointment_plan_id', 'provider_id']);
      query.descending('createdAt');

      const results = await query.find({useMasterKey: true});

      const formatted = results.map(app => ({
        id: app.id,
        status: app.get('status'),
        note: app.get('note'),
        created_at: app.get('created_at'),
        appointment_plan: {
          id: app.get('appointment_plan_id')?.id,
          title: app.get('appointment_plan_id')?.get('title'),
          duration_minutes: app
            .get('appointment_plan_id')
            ?.get('duration_minutes'),
          price: app.get('appointment_plan_id')?.get('price'),
        },
        provider: {
          id: app.get('provider_id')?.id,
          name: app.get('provider_id')?.get('username'),
        },
      }));

      return formatted;
    } catch (error: any) {
      console.error('Error in getChildAppointments:', error);
      throw {
        codeStatus: error.codeStatus || 1004,
        message: error.message || 'Failed to retrieve child appointments',
      };
    }
  }
  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: true,
      fields: {
        appointment_id: {type: String, required: true},
      },
    },
  })
  async getAppointmentDetails(req: Parse.Cloud.FunctionRequest) {
    try {
      const user = req.user;
      if (!user) {
        throw {codeStatus: 103, message: 'User context is missing'};
      }

      const {appointment_id} = req.params;

      const query = new Parse.Query(Appointment);
      query.equalTo('objectId', appointment_id);
      query.include([
        'appointment_plan_id',
        'provider_id',
        'child_id',
        'user_id',
      ]);
      const appointment = await query.first({useMasterKey: true});

      if (!appointment) {
        throw {codeStatus: 104, message: 'Appointment not found'};
      }

      return {
        id: appointment.id,
        status: appointment.get('status'),
        note: appointment.get('note'),
        created_at: appointment.get('created_at'),
        appointment_plan: {
          id: appointment.get('appointment_plan_id')?.id,
          title: appointment.get('appointment_plan_id')?.get('title'),
          duration_minutes: appointment
            .get('appointment_plan_id')
            ?.get('duration_minutes'),
          price: appointment.get('appointment_plan_id')?.get('price'),
        },
        provider: {
          id: appointment.get('provider_id')?.id,
          name: appointment.get('provider_id')?.get('username'),
        },
        child: {
          id: appointment.get('child_id')?.id,
          name: appointment.get('child_id')?.get('fullName'),
        },
        requested_by: {
          id: appointment.get('user_id')?.id,
          name: appointment.get('user_id')?.get('username'),
        },
      };
    } catch (error: any) {
      console.error('Error in getAppointmentDetails:', error);
      throw {
        codeStatus: error.codeStatus || 1005,
        message: error.message || 'Failed to retrieve appointment details',
      };
    }
  }
  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: true,
    },
  })
  async getPendingAppointmentsForProvider(req: Parse.Cloud.FunctionRequest) {
    try {
      const user = req.user;
      if (!user) {
        throw {codeStatus: 103, message: 'User context is missing'};
      }

      const query = new Parse.Query(Appointment);
      query.equalTo('provider_id', user);
      query.equalTo('status', 'pending_provider_approval');
      query.include(['appointment_plan_id', 'child_id', 'user_id']);
      query.descending('createdAt');

      const results = await query.find({useMasterKey: true});

      const formatted = results.map(app => {
        const plan = app.get('appointment_plan_id');
        const child = app.get('child_id');
        const requestedBy = app.get('user_id');

        return {
          id: app.id,
          note: app.get('note'),
          created_at: app.get('created_at'),
          appointment_plan: plan
            ? {
                id: plan.id,
                title: plan.get('title'),
                duration_minutes: plan.get('duration_minutes'),
                price: plan.get('price'),
              }
            : {},
          child: child
            ? {
                id: child.id,
                name: child.get('fullName'),
              }
            : {},
          requested_by: requestedBy
            ? {
                id: requestedBy.id,
                name: requestedBy.get('username'),
              }
            : {},
        };
      });

      return formatted;
    } catch (error: any) {
      console.error('Error in getPendingAppointmentsForProvider:', error);
      throw {
        codeStatus: error.codeStatus || 1007,
        message: error.message || 'Failed to retrieve pending appointments',
      };
    }
  }

  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: true,
      fields: {
        child_id: {type: String, required: true},
      },
    },
  })
  async canAccessChildEvaluation(req: Parse.Cloud.FunctionRequest) {
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

      const allowedRoles = ['Psychologist', 'Doctor'];
      if (!allowedRoles.includes(roleName)) {
        throw {
          codeStatus: 102,
          message:
            'Unauthorized: Only providers with valid roles can access evaluations',
        };
      }

      const {child_id} = req.params;

      const query = new Parse.Query(Appointment);
      query.equalTo(
        'child_id',
        new Parse.Object('ChildProfile', {id: child_id})
      );
      query.equalTo('provider_id', user);
      query.containedIn('status', [
        'confirmed',
        'completed',
        'paid',
        'pending_provider_approval',
      ]);
      const result = await query.first({useMasterKey: true});

      if (result) {
        return {
          canAccess: true,
          message:
            'Access granted: Provider has a valid appointment with this child',
        };
      } else {
        return {
          canAccess: false,
          message: 'Access denied: No valid appointment found for this child',
        };
      }
    } catch (error: any) {
      console.error('Error in canAccessChildEvaluation:', error);
      throw {
        codeStatus: error.codeStatus || 1006,
        message: error.message || 'Failed to verify access to child evaluation',
      };
    }
  }
}

export default new AppointmentFunctions();

import {CloudFunction} from '../../utils/Registry/decorators';
import ChatGroup from '../../models/ChatGroup';
import ChatGroupParticipant from '../../models/ChatGroupParticipant';
import Appointment from '../../models/Appointment';

class ChatGroupFunctions {
  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: true,
      fields: {
        appointment_id: {type: String, required: true},
      },
    },
  })
  async createChatGroupForAppointment(req: Parse.Cloud.FunctionRequest) {
    try {
      const user = req.user;
      if (!user) {
        throw {codeStatus: 103, message: 'User context is missing'};
      }

      const {appointment_id} = req.params;

      const appointment = await new Parse.Query(Appointment)
        .include(['user_id', 'provider_id', 'child_id'])
        .get(appointment_id, {useMasterKey: true});

      if (!appointment) {
        throw {codeStatus: 104, message: 'Appointment not found'};
      }

      const provider = appointment.get('provider_id');
      const requester = appointment.get('user_id');

      const isParticipant =
        provider?.id === user.id || requester?.id === user.id;

      if (!isParticipant) {
        throw {
          codeStatus: 102,
          message: 'Unauthorized: You are not part of this appointment',
        };
      }

      const chatGroup = new ChatGroup();
      chatGroup.set('appointment_id', appointment);
      chatGroup.set('child_id', appointment.get('child_id'));
      chatGroup.set('chat_status', 'active');
      await chatGroup.save(null, {useMasterKey: true});

      const participants = [provider, requester];
      for (const participant of participants) {
        const chatParticipant = new ChatGroupParticipant();
        chatParticipant.set('chat_group_id', chatGroup);
        chatParticipant.set('user_id', participant);
        await chatParticipant.save(null, {useMasterKey: true});
      }

      return {
        message: 'Chat group created successfully',
        chat_group_id: chatGroup.id,
      };
    } catch (error: any) {
      console.error('Error in createChatGroupForAppointment:', error);
      throw {
        codeStatus: error.codeStatus || 1009,
        message: error.message || 'Failed to create chat group for appointment',
      };
    }
  }
}

export default new ChatGroupFunctions();

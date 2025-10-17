import {CloudFunction} from '../../utils/Registry/decorators';
import ChatMessage from '../../models/ChatMessage';
import ChatGroup from '../../models/ChatGroup';

class ChatMessageFunctions {
  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: true,
      fields: {
        chat_group_id: {type: String, required: true},
        message: {type: String, required: true},
        child_id: {type: String, required: false},
      },
    },
  })
  async sendChatMessage(req: Parse.Cloud.FunctionRequest) {
    try {
      const user = req.user;
      if (!user) {
        throw {codeStatus: 103, message: 'User context is missing'};
      }

      const {chat_group_id, message, child_id} = req.params;

      const chatGroup = await new Parse.Query(ChatGroup)
        .include([
          'appointment_id',
          'appointment_id.user_id',
          'appointment_id.provider_id',
        ])
        .get(chat_group_id, {useMasterKey: true});

      if (!chatGroup) {
        throw {codeStatus: 104, message: 'Chat group not found'};
      }

      const appointment = chatGroup.get('appointment_id');
      const senderId = user.id;

      const userA = appointment.get('user_id')?.id;
      const userB = appointment.get('provider_id')?.id;

      const receiverId = senderId === userA ? userB : userA;

      const chatMessage = new ChatMessage();
      chatMessage.set('chat_group_id', chatGroup);
      chatMessage.set('send_id', user);
      chatMessage.set(
        'receive_id',
        new Parse.Object('_User', {id: receiverId})
      );
      chatMessage.set('message', message);
      chatMessage.set('time', new Date());

      if (child_id) {
        chatMessage.set(
          'child_id',
          new Parse.Object('ChildProfile', {id: child_id})
        );
      }

      const notification = new Parse.Object('Notifications');
      notification.set('user_id', new Parse.Object('_User', {id: receiverId}));
      notification.set('title', 'رسالة جديدة');
      notification.set('body', `لديك رسالة جديدة من ${user.get('username')}`);
      notification.set('image', null);
      await notification.save(null, {useMasterKey: true});

      chatMessage.set('notifications_id', notification);
      await chatMessage.save(null, {useMasterKey: true});

      chatGroup.set('last_message', message);
      await chatGroup.save(null, {useMasterKey: true});

      return {
        message: 'Message sent successfully',
        chat_message_id: chatMessage.id,
        notification_id: notification.id,
      };
    } catch (error: any) {
      console.error('Error in sendChatMessage:', error);
      throw {
        codeStatus: error.codeStatus || 1016,
        message: error.message || 'Failed to send chat message',
      };
    }
  }

  @CloudFunction({
    methods: ['GET'],
    validation: {
      requireUser: true,
      fields: {
        chat_group_id: {type: String, required: true},
      },
    },
  })
  async getChatMessages(req: Parse.Cloud.FunctionRequest) {
    try {
      const user = req.user;
      if (!user) {
        throw {codeStatus: 103, message: 'User context is missing'};
      }

      const {chat_group_id} = req.params;

      const chatGroup = new ChatGroup();
      chatGroup.id = chat_group_id;

      const query = new Parse.Query(ChatMessage);
      query.equalTo('chat_group_id', chatGroup);
      query.include(['send_id', 'receive_id', 'child_id']);
      query.ascending('time');
      query.limit(100);

      const results = await query.find({useMasterKey: true});

      const messages = results.map(msg => ({
        objectId: msg.id,
        message: msg.get('message'),
        time: msg.get('time'),
        send_id: {
          id: msg.get('send_id')?.id,
          username: msg.get('send_id')?.get('username'),
        },
        receive_id: {
          id: msg.get('receive_id')?.id,
          username: msg.get('receive_id')?.get('username'),
        },
        child_id: msg.get('child_id')?.id || null,
      }));

      return {
        count: messages.length,
        messages,
      };
    } catch (error: any) {
      console.error('Error in getChatMessages:', error);
      throw {
        codeStatus: error.codeStatus || 1017,
        message: error.message || 'Failed to fetch chat messages',
      };
    }
  }
  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: true,
      fields: {
        chat_message_id: {type: String, required: true},
      },
    },
  })
  async markMessageAsRead(req: Parse.Cloud.FunctionRequest) {
    try {
      const user = req.user;
      if (!user) {
        throw {codeStatus: 103, message: 'User context is missing'};
      }

      const {chat_message_id} = req.params;

      const message = await new Parse.Query(ChatMessage)
        .include(['receive_id'])
        .get(chat_message_id, {useMasterKey: true});

      if (!message) {
        throw {codeStatus: 104, message: 'Message not found'};
      }

      const receiver = message.get('receive_id');
      if (!receiver || receiver.id !== user.id) {
        throw {
          codeStatus: 102,
          message: 'Unauthorized: You are not the receiver of this message',
        };
      }

      message.set('is_read', true);
      message.set('read_at', new Date());
      await message.save(null, {useMasterKey: true});

      return {
        message: 'Message marked as read',
        chat_message_id: message.id,
        read_at: message.get('read_at'),
      };
    } catch (error: any) {
      console.error('Error in markMessageAsRead:', error);
      throw {
        codeStatus: error.codeStatus || 1018,
        message: error.message || 'Failed to mark message as read',
      };
    }
  }
  @CloudFunction({
    methods: ['GET'],
    validation: {
      requireUser: true,
    },
  })
  async getUserChatGroups(req: Parse.Cloud.FunctionRequest) {
    try {
      const user = req.user;
      if (!user) {
        throw {codeStatus: 103, message: 'User context is missing'};
      }

      const query = new Parse.Query(ChatGroup);
      query.include([
        'appointment_id',
        'appointment_id.user_id',
        'appointment_id.provider_id',
      ]);
      query.limit(100);
      query.descending('updatedAt');

      const appointmentQueryA = new Parse.Query('Appointment').equalTo(
        'user_id',
        user
      );
      const appointmentQueryB = new Parse.Query('Appointment').equalTo(
        'provider_id',
        user
      );
      const combinedAppointmentQuery = Parse.Query.or(
        appointmentQueryA,
        appointmentQueryB
      );

      query.matchesQuery('appointment_id', combinedAppointmentQuery);

      const results = await query.find({useMasterKey: true});

      const groups = results.map(group => {
        const appointment = group.get('appointment_id');
        return {
          objectId: group.id,
          last_message: group.get('last_message') || null,
          updatedAt: group.updatedAt,
          appointment: {
            objectId: appointment?.id,
            user_id: {
              id: appointment?.get('user_id')?.id,
              username: appointment?.get('user_id')?.get('username'),
            },
            provider_id: {
              id: appointment?.get('provider_id')?.id,
              username: appointment?.get('provider_id')?.get('username'),
            },
          },
        };
      });

      return {
        count: groups.length,
        chat_groups: groups,
      };
    } catch (error: any) {
      console.error('Error in getUserChatGroups:', error);
      throw {
        codeStatus: error.codeStatus || 1019,
        message: error.message || 'Failed to fetch user chat groups',
      };
    }
  }
}

export default new ChatMessageFunctions();

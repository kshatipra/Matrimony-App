export type InterestStatus = 'pending' | 'accepted' | 'declined';

export type Interest = {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: InterestStatus;
  created_at: string;
};

export type Conversation = {
  id: string;
  interest_id: string;
  created_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

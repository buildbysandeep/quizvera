export interface IUser {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface IGroup {
  id: string;
  name: string;
  desc: string;
  adminId: string;

  quizzes: IQuiz[];
}

export interface IQuiz {
  id: string;
  title: string;
  desc: string;
  duration: number;
  maxMarks: number;
  userInputs: string[];
  footerHeading1: string;
  footerHeading2: string;
  footerText1: string;
  footerText2: string;
  footerLink: string;
  author: string;
  groupId: string;
  published: boolean;

  isStrictMode: boolean;
  translationEnabled: boolean;
  sourceLanguage?: string;
  targetLanguage?: string;

  questions: IQuestion[];
  images?: IImage[];
  participants?: IQuizParticipant[];
  createdAt: Date;
}

export interface IQuestion {
  id: string;
  title: string;
  translatedTitle: string;
  showSnippet: boolean;
  snippet: string;
  snippetLang: string;
  answer: string;
  quizId: string;
  options: IOption[];
}

export interface IOption {
  id: string;
  key: string;
  value: string;
  translatedValue: string;
  questionId: string;
}

export interface IImage {
  id?: string;
  key: string;
  publicId?: string;
  file?: File;
  url: string;
  quizId?: string;
}

export interface IQuizParticipant {
  id: string;
  userId: string;
  quizId: string;
  groupId: string;
  isQualified: boolean;
  anyReason?: string;
  sentEmailId?: string;
  User: IUser;
  Quiz: IQuiz;
  Group?: IGroup;

  percentile?: string;
  Answers: IParticipantQuizAnswer[];
  QuizInputs: { id: string; key: string; value: string; quizParticipantId: string }[];
  createdAt: Date;
}

export interface IParticipantQuizAnswer {
  id?: string;
  answer: string;
  questionId: string;
  Question?: IQuestion;
  quizParticipantId?: string;
  QuizParticipant?: IQuizParticipant;
}

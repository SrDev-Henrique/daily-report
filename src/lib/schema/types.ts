export type status = "ok" | "pendente" | "em progresso" | "não feito";

export type Checklist = {
  limpeza: {
    salao: status;
    banheiro_masculino: status;
    banheiro_hc_masculino: status;
    banheiro_feminino: status;
    banheiro_hc_feminino: status;
    copa: status;
    area_servico: status;
    area_cozinha: status;
    area_bar: status;
  };
  buffet: status;
  geladeira: status;
};

export type RoundsUpdateData = {
  date?: string;
  created_at?: Date;
  user_id?: number;
  status?: status;
  checklist?: Checklist;
  notes?: string | null;
  started_at?: Date;
  finished_at?: Date;
  duration?: number;
};

export type FeedbackUpdateData = {
  created_at?: Date;
  user_id?: number;
  type?: string;
  text?: string;
};

export type IssueUpdateData = {
  created_at?: Date;
  round_id?: number;
  category?: string;
  severity?: string;
  description?: string;
};

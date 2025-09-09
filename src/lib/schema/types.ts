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

export type UpdateData = {
  created_at?: Date;
  user_id?: number;
  status?: string;
  checklist?: Checklist;
  notes?: string | null;
};

export type status = "ok" | "pendente" | "não feito";

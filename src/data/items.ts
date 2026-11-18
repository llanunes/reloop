// Itens aceitos no descarte e quantos pontos cada unidade vale (valores de exemplo).
export type ItemModel = { name: string; weight: string; pointsPerUnit: number };
export type ItemType = { name: string; models: ItemModel[] };

export const itemTypes: ItemType[] = [
  {
    name: 'Pilha Comum (Zinco)',
    models: [
      { name: 'Duracel - AA', weight: '12g - 13g', pointsPerUnit: 17 },
      { name: 'Duracel - AAA', weight: '7g - 8g', pointsPerUnit: 12 },
      { name: 'Genérica - AA', weight: '11g - 13g', pointsPerUnit: 15 },
    ],
  },
  {
    name: 'Pilha Alcalina',
    models: [
      { name: 'AA', weight: '23g - 24g', pointsPerUnit: 20 },
      { name: 'AAA', weight: '11g - 12g', pointsPerUnit: 15 },
      { name: '9V', weight: '45g - 47g', pointsPerUnit: 35 },
    ],
  },
  {
    name: 'Bateria de Celular',
    models: [
      { name: 'Lítio - até 3000 mAh', weight: '40g - 50g', pointsPerUnit: 60 },
      { name: 'Lítio - acima de 3000 mAh', weight: '50g - 70g', pointsPerUnit: 80 },
    ],
  },
  {
    name: 'Celular',
    models: [
      { name: 'Smartphone', weight: '150g - 220g', pointsPerUnit: 250 },
      { name: 'Celular simples', weight: '80g - 120g', pointsPerUnit: 150 },
    ],
  },
  {
    name: 'Cabos e Carregadores',
    models: [
      { name: 'Carregador de tomada', weight: '50g - 100g', pointsPerUnit: 40 },
      { name: 'Cabo USB', weight: '20g - 40g', pointsPerUnit: 20 },
    ],
  },
];

// Validação da foto do descarte 100% no celular, grátis e offline, com o ML Kit do Google
// (modelo base de "image labeling", que reconhece cerca de 400 categorias genéricas em inglês).
// Limitações: ele diz O QUE aparece na foto (ex.: "Mobile phone"), mas não conta itens nem sabe
// se estão fora da embalagem, e não conhece pilhas (reconhece como "Toy").
import ImageLabeling, { Label } from '@react-native-ml-kit/image-labeling';

export type PhotoValidation = {
  approved: boolean;
  /** Etiquetas que o ML Kit encontrou (o módulo nativo só devolve as com 50% ou mais). */
  labels: Label[];
  reason: string;
};

/**
 * Palavras (em inglês, como o ML Kit responde) aceitas para cada tipo de item do formulário.
 * A comparação é por trecho, sem diferenciar maiúsculas: "phone" casa com "Mobile phone".
 */
const EXPECTED: Record<string, string[]> = {
  'Pilha Comum (Zinco)': ['battery', 'batteries', 'cylinder', 'metal', 'gadget', 'electronic'],
  'Pilha Alcalina': ['battery', 'batteries', 'cylinder', 'metal', 'gadget', 'electronic'],
  'Bateria de Celular': ['battery', 'mobile phone', 'phone', 'gadget', 'electronic'],
  Celular: ['mobile phone', 'phone', 'smartphone', 'gadget', 'electronic', 'telephone'],
  'Cabos e Carregadores': ['cable', 'wire', 'cord', 'plug', 'charger', 'adapter', 'electronic', 'gadget'],
};

/** Etiquetas que indicam que a foto não é do descarte (foto de tela, de pessoa etc.). */
const SUSPICIOUS = ['screenshot', 'selfie', 'poster', 'television', 'monitor', 'display device'];

const contains = (label: string, words: string[]) => words.some((word) => label.toLowerCase().includes(word));

export async function validatePhoto(input: { uri: string; itemName: string }): Promise<PhotoValidation> {
  const labels = (await ImageLabeling.label(input.uri)).sort((a, b) => b.confidence - a.confidence);
  const expected = EXPECTED[input.itemName] ?? ['electronic', 'gadget'];

  if (!labels.length) {
    return { approved: false, labels, reason: 'Não conseguimos reconhecer nada na foto. Tire outra, com boa luz e os itens bem visíveis.' };
  }
  if (labels.some((l) => contains(l.text, SUSPICIOUS))) {
    return { approved: false, labels, reason: 'Parece uma foto de tela ou de outra coisa. Fotografe os itens de verdade, fora das embalagens.' };
  }
  if (labels.some((l) => contains(l.text, expected))) {
    return { approved: true, labels, reason: 'A foto parece mostrar os itens declarados.' };
  }
  return { approved: false, labels, reason: `A foto não parece mostrar ${input.itemName.toLowerCase()}. Confira o formulário ou tire outra foto.` };
}

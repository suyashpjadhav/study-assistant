export const studyMaterialJsonSchema = {
  type: 'object',
  properties: {
    studyable: { type: 'boolean' },
    title: { type: 'string' },
    flashcards: {
      type: 'array',
      items: {
        type: 'object',
        properties: { front: { type: 'string' }, back: { type: 'string' } },
        required: ['front', 'back'],
        additionalProperties: false,
      },
    },
    quiz: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          correctIndex: { type: 'integer' },
          explanation: { type: 'string' },
        },
        required: ['question', 'options', 'correctIndex', 'explanation'],
        additionalProperties: false,
      },
    },
  },
  required: ['studyable', 'title', 'flashcards', 'quiz'],
  additionalProperties: false,
};
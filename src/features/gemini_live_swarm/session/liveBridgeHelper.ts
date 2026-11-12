export const A2UI_TOOL_DECLARATIONS = [
  {
    name: 'render_a2ui',
    description: 'Render a specific A2UI component with the provided data model.',
    parameters: {
      type: 'OBJECT',
      properties: {
        componentId: {
          type: 'STRING',
          description: 'The ID of the component to render.',
        },
        dataModel: {
          type: 'OBJECT',
          description: 'The data model to pass to the component.',
        },
      },
      required: ['componentId', 'dataModel'],
    },
  },
  {
    name: 'clear_a2ui',
    description: 'Clear any currently rendered A2UI components.',
    parameters: {
      type: 'OBJECT',
      properties: {},
    },
  },
];

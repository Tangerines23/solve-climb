export default function (plop) {
    plop.setGenerator('component', {
        description: 'Create a reusable component',
        prompts: [
            {
                type: 'input',
                name: 'name',
                message: 'What is your component name?',
            },
        ],
        actions: [
            {
                type: 'add',
                path: 'src/components/{{pascalCase name}}.tsx',
                templateFile: 'plop-templates/Component.tsx.hbs',
            },
            {
                type: 'add',
                path: 'src/components/{{pascalCase name}}.css',
                templateFile: 'plop-templates/Component.css.hbs',
            },
            {
                type: 'add',
                path: 'src/components/__tests__/{{pascalCase name}}.test.tsx',
                templateFile: 'plop-templates/Component.test.tsx.hbs',
            },
        ],
    });
}

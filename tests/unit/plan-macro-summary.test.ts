import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

// Run the Planner's production calculation without mounting its Firebase UI.
// Include the pure helper when the calculation delegates to one.
const path = 'src/features/meal-planning/MealPlanner.tsx';
const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let calculation: ts.Expression | undefined;
function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'macroTotals') {
        assert.ok(node.initializer && ts.isCallExpression(node.initializer));
        calculation = node.initializer.arguments[0];
    }
    ts.forEachChild(node, visit);
}
visit(source);
assert.ok(calculation, 'locate the production macro calculation');
const helpers = source.statements.filter(ts.isFunctionDeclaration)
    .filter(node => node.name?.text === 'getPlanMacroTotals')
    .map(node => node.getText(source)).join('\n');
const code = ts.transpileModule(`${helpers}\n(${calculation.getText(source)})()`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;

test('R10 plan macro summary averages both populated days and excludes empty days', () => {
    const meal = (calories: number, protein: number, carbs: number, fat: number) => ({ calories, protein, carbs, fat });
    const displayPlan = { days: [
        { dayName: 'Monday', totalCalories: 400, meals: [meal(400, 20, 50, 10)] },
        { dayName: 'Tuesday', totalCalories: 800, meals: [meal(300, 30, 20, 10), meal(500, 30, 50, 20)] },
        { dayName: 'Wednesday', totalCalories: 0, meals: [] },
    ] };
    const totals = vm.runInNewContext(code, { displayPlan }, { filename: path });
    assert.equal(totals.calories, 600, 'R10 calories must average Monday and Tuesday, not use Monday alone');
    assert.equal(totals.protein, 40);
    assert.equal(totals.carbs, 60);
    assert.equal(totals.fat, 20);
});

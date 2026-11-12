import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { fromKg, toKg, type MeasurementUnit } from '../../src/shared/units.ts';

// Execute the production button handler and deficit helper without mounting
// Settings' Firebase providers or copying the formula into the test.
const path = 'src/features/settings/Settings.tsx';
const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function extract(predicate: (node: ts.Node) => boolean): ts.Node {
    const matches: ts.Node[] = [];
    const visit = (node: ts.Node) => {
        if (predicate(node)) matches.push(node);
        ts.forEachChild(node, visit);
    };
    visit(source);
    assert.equal(matches.length, 1, 'locate exactly one production handler/helper');
    return matches[0];
}

const button = extract(node => ts.isJsxElement(node)
    && node.openingElement.tagName.getText(source) === 'button'
    && node.children.some(child => ts.isJsxText(child) && child.text.trim() === 'Auto-Update'));
assert.ok(ts.isJsxElement(button));
const onClick = button.openingElement.attributes.properties.find(attribute =>
    ts.isJsxAttribute(attribute) && attribute.name.getText(source) === 'onClick');
assert.ok(onClick && ts.isJsxAttribute(onClick) && onClick.initializer && ts.isJsxExpression(onClick.initializer));
assert.ok(onClick.initializer.expression);
const deficit = extract(node => ts.isVariableDeclaration(node) && node.name.getText(source) === 'getCalorieDeficit');
const code = ts.transpileModule(`const ${deficit.getText(source)};\n(${onClick.initializer.expression.getText(source)})`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;

function autoUpdate(weight: number | undefined, unit: MeasurementUnit, rate = 0): number | undefined {
    let target: number | undefined;
    const handler = vm.runInNewContext(code, {
        localSettings: { currentWeight: weight, rateOfChange: rate, measurementUnit: unit },
        settingsUnit: unit,
        fromKg,
        toKg,
        handleLocalChange: (field: string, value: number) => {
            assert.equal(field, 'dailyCalorieTarget');
            target = value;
        },
    }, { filename: path }) as () => void;
    handler();
    return target;
}

test('R8: Settings Auto-Update gives equivalent targets for 70 kg and 154 lb', () => {
    const metric = autoUpdate(70, 'metric');
    const imperial = autoUpdate(154, 'imperial');
    assert.ok(metric !== undefined && imperial !== undefined);
    // 154 lb is a rounded equivalent of 70 kg; the target differs by 5 kcal.
    assert.ok(Math.abs(metric - imperial) <= 5,
        `70 kg gave ${metric} kcal, but 154 lb gave ${imperial} kcal`);
    assert.equal(metric, 1911);
    assert.equal(autoUpdate(fromKg(70, 'imperial'), 'imperial'), metric);
});

test('R8: Settings Auto-Update preserves imperial targets and deficit boundaries', () => {
    for (const [rate, expected] of [[0, 2270], [30, 2270], [31, 2020], [60, 2020], [61, 1770], [80, 1770], [81, 1520], [100, 1520]]) {
        assert.equal(autoUpdate(180, 'imperial', rate), expected, `imperial rate ${rate}`);
        assert.equal(autoUpdate(toKg(180, 'imperial'), 'metric', rate), expected, `metric rate ${rate}`);
    }
});

test('R8: Settings Auto-Update leaves the target alone without a current weight', () => {
    for (const unit of ['metric', 'imperial'] as const) {
        assert.equal(autoUpdate(undefined, unit), undefined);
        assert.equal(autoUpdate(0, unit), undefined);
    }
});

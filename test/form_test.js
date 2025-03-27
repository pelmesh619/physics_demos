function main() {
    var coordinatesSystemForm = new FormMaker("myForm");

    const dipoles = new ListInputScheme(
        new CompoundInputScheme({
            moment: new Vec2InputScheme(new ScienceNumberInputScheme(1e-9, 'Кл·м', 0.001), new ScienceNumberInputScheme(1e-9, 'Кл·м', 0.001)).WithLabel('\\( \\vec p = \\)'),
            position: new Vec2InputScheme(new NumberInputScheme(0, 'м', 0.001), new NumberInputScheme(0, 'м', 0.001)).WithLabel('\\( \\vec{r} = \\)'),
        })
    ).Build("dipoles", 'Диполи:')
    .WithAddButtonText('Добавить диполь')
    .WithRemoveButtonText('Удалить диполь');

    coordinatesSystemForm
    .AddInputObject(
        new RadioInput("isometric", "outputProjection", "Изометрическая", true)
    ).AddInputObject(
        new RadioInput("dimetric", "outputProjection", "Диметрическая")
    ).AddInputObject(
        new RadioInput("cartesian", "coordinatesType", "Прямоугольная система", true, updateCoordinatesValuesForm)
    ).AddInputObject(
        new RadioInput("cylindical", "coordinatesType", "Цилиндрическая система", false, updateCoordinatesValuesForm)
    ).AddInputObject(
        new RadioInput("spherical", "coordinatesType", "Сферическая система", false, updateCoordinatesValuesForm)
    ).AddChildForm(new FormMaker("coordinatesValuesForm"))
    .AddChildForm(new FormMaker("coordinatesOutputForm"))
    .AddSubmitButton("submit", "Подтвердить", (v) => { window.alert(JSON.stringify(v)); })
    .AddInputObject(new CheckboxInput("otherParams", "stop", "Остановить симуляцию?"))
    .AddInputObject(new Vec2InputScheme(new NumberInputScheme(0, 'м'), new NumberInputScheme(0, 'м')).Build('someVector', 'Мой вектор'))
    .AddInputObject(new NumberInputScheme(0, 'м').Build('someVectorLength', 'Длина'))
    .ConnectInputs('someVector', 'someVectorLength', (vec) => vec.length, (x) => Vec2.Right.multiply(x))
    .AddInputObject(new ListInputScheme(new Vec2InputScheme(new NumberInputScheme(0, 'м'), new NumberInputScheme(0, 'м'))).Build('someVectorList', 'Мой вектор'))
    .AddInputObject(new NumberInputScheme(0, 'м').Build('someVectorListLength', 'Длина векторов'))
    .ConnectInputs('someVectorList', 'someVectorListLength', (vecList) => { let s = 0; vecList.forEach((v) => { s += v.length; }); return s; }, )
    .AddInputObject(new ListInputScheme(new CompoundInputScheme({
        charge: new NumberInputScheme(0, 'Кл'), 
        position: new Vec2InputScheme(new NumberInputScheme(0, 'м'), new NumberInputScheme(0, 'м'))
    })).Build('chargeList', 'Заряды'))
    .AddInputObject(new ScienceNumberInputScheme(0, 'м').Build('someAdvancedLength', 'Большая длина'))
    .AddInputObject(new NumberInputScheme(0, 'м').Build('someAdvancedLengthSimple', 'Большая длина поменьше'))
    .ConnectInputs('someAdvancedLength', 'someAdvancedLengthSimple', (n) => n, (n) => n)
    .AddInputObject(dipoles);
    
    updateCoordinatesValuesForm();
}

function updateCoordinatesValuesForm(e) {
    const coordinatesSystemForm = new FormMaker("myForm");
    const valuesType = coordinatesSystemForm.GetValues()["coordinatesType"];
    const coordinatesValuesFrom = new FormMaker("coordinatesValuesForm").Clear();

    if (valuesType == "cartesian") {
        coordinatesValuesFrom
        .AddInputObject(new NumberInputScheme(0, "м", 0.001).Build("x", "x = "))
        .AddInputObject(new NumberInputScheme(0, "м", 0.001).Build("y", "y = "))
        .AddInputObject(new NumberInputScheme(0, "м", 0.001).Build("z", "z = "))
    } else if (valuesType == "cylindical") {
        coordinatesValuesFrom
        .AddInputObject(new NumberInputScheme(0, "м", 0.001).Build("r", "r = "))
        .AddInputObject(new NumberInputScheme(0, "rad", 0.001).Build("phi", "phi = "))
        .AddInputObject(new NumberInputScheme(0, "deg", 0.001).Build("phi_deg", ""))
        .AddInputObject(new NumberInputScheme(0, "м", 0.001).Build("z", "z = "))
        .ConnectInputs('phi', 'phi_deg', (x) => { return x / Math.PI * 180; }, (x) => { return x * Math.PI / 180; })
    } else if (valuesType == "spherical") {
        coordinatesValuesFrom
        .AddInputObject(new NumberInputScheme(0, "м", 0.001).Build("r", "r = "))
        .AddInputObject(new NumberInputScheme(0, "rad", 0.001).Build("phi", "phi = "))
        .AddInputObject(new NumberInputScheme(0, "deg", 0.001).Build("phi_deg", ""))
        .AddInputObject(new NumberInputScheme(0, "rad", 0.001).Build("theta", "theta = "))
        .AddInputObject(new NumberInputScheme(0, "deg", 0.001).Build("theta_deg", ""))
        .ConnectInputs('phi', 'phi_deg', (x) => { return x / Math.PI * 180; }, (x) => { return x * Math.PI / 180; })
        .ConnectInputs('theta', 'theta_deg', (x) => { return x / Math.PI * 180; }, (x) => { return x * Math.PI / 180; });
    }
}

window.onload = main;

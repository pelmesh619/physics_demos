function main() {
    var coordinatesSystemForm = new FormMaker("myForm");

    coordinatesSystemForm
    .AddRadio(
        new RadioInput("isometric", "outputProjection", "Изометрическая", true)
    )
    .AddRadio(
        new RadioInput("dimetric", "outputProjection", "Диметрическая")
    ).AddRadio(
        new RadioInput("cartesian", "coordinatesType", "Прямоугольная система", true, updateCoordinatesValuesForm)
    ).AddRadio(
        new RadioInput("cylindical", "coordinatesType", "Цилиндрическая система", false, updateCoordinatesValuesForm)
    ).AddRadio(
        new RadioInput("spherical", "coordinatesType", "Сферическая система", false, updateCoordinatesValuesForm)
    ).AddChildForm("coordinatesValuesForm")
    .AddChildForm("coordinatesOutputForm")
    .AddSubmitButton("submit", "Подтвердить", (v) => { window.alert(JSON.stringify(v)); })
    .AddCheckbox(new CheckboxInput("otherParams", "stop", "Остановить симуляцию?"))
    .AddInputObject(new Vec2InputScheme(new NumberInputScheme(0, 'м'), new NumberInputScheme(0, 'м')).Build('someVector', 'Мой вектор'))
    .AddInputObject(new NumberInputScheme(0, 'м').Build('someVectorLength', 'Длина'))
    .ConnectInputs('someVector', 'someVectorLength', (vec) => vec.length, (x) => Vec2.Right.multiply(x));

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

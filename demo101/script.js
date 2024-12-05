function main() {
    var coordinatesSystemForm = new FormMaker("coordinatesSystemForm");

    coordinatesSystemForm
    .AddRadio(
        "outputProjection", 
        new RadioInput("isometric", "Изометрическая", true)
    )
    .AddRadio(
        "outputProjection", 
        new RadioInput("dimetric", "Диметрическая")
    ).AddRadio(
        "coordinatesType", 
        new RadioInput("cartesian", "Прямоугольная система", true, updateCoordinatesValuesForm)
    ).AddRadio(
        "coordinatesType", 
        new RadioInput("cylindical", "Цилиндрическая система", false, updateCoordinatesValuesForm)
    ).AddRadio(
        "coordinatesType", 
        new RadioInput("spherical", "Сферическая система", false, updateCoordinatesValuesForm)
    ).AddChildForm("coordinatesValuesForm")
    .AddChildForm("coordinatesOutputForm")
    .AddSubmitButton("submit", "Подтвердить", (v) => { console.log(v); })
    .AddCheckbox("otherParams", new CheckboxInput("stop", "Остановить симуляцию?"));
}

function updateCoordinatesValuesForm(e) {
    const coordinatesSystemForm = new FormMaker("coordinatesSystemForm");
    const valuesType = coordinatesSystemForm.GetValues()["coordinatesType"];
    const coordinatesValuesFrom = new FormMaker("coordinatesValuesForm").Clear();

    if (valuesType == "cartesian") {
        coordinatesValuesFrom
        .AddNumber("coordinatesValues", new NumberInput("x", "x = ", "м", 0.001))
        .AddNumber("coordinatesValues", new NumberInput("y", "y = ", "м", 0.001))
        .AddNumber("coordinatesValues", new NumberInput("z", "z = ", "м", 0.001))
    } else if (valuesType == "cylindical") {
        coordinatesValuesFrom
        .AddNumber("coordinatesValues", new NumberInput("r", "r = ", "м", 0.001))
        .AddNumber("coordinatesValues", new NumberInput("phi", "phi = ", "rad", 0.001))
        .AddNumber("coordinatesValues", new NumberInput("phi_deg", "", "deg", 0.001))
        .AddNumber("coordinatesValues", new NumberInput("z", "z = ", "м", 0.001))
        .ConnectNumbers('phi', 'phi_deg', (x) => { return x / Math.PI * 180; }, (x) => { return x * Math.PI / 180; })
    } else if (valuesType == "spherical") {
        coordinatesValuesFrom
        .AddNumber("coordinatesValues", new NumberInput("r", "r = ", "м", 0.001))
        .AddNumber("coordinatesValues", new NumberInput("phi", "phi = ", "rad", 0.001))
        .AddNumber("coordinatesValues", new NumberInput("phi_deg", "", "deg", 0.001))
        .AddNumber("coordinatesValues", new NumberInput("theta", "theta = ", "rad", 0.001))
        .AddNumber("coordinatesValues", new NumberInput("theta_deg", "", "deg", 0.001))
        .ConnectNumbers('phi', 'phi_deg', (x) => { return x / Math.PI * 180; }, (x) => { return x * Math.PI / 180; })
        .ConnectNumbers('theta', 'theta_deg', (x) => { return x / Math.PI * 180; }, (x) => { return x * Math.PI / 180; });
    }



    
}

window.onload = main;

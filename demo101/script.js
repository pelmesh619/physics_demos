function main() {
    var coordinatesSystemForm = new FormMaker("coordinatesSystemForm");

    coordinatesSystemForm.AddParagraph("Из системы:")
    .AddRadio(
        new RadioInput("cartesian", "coordinatesType", "прямоугольной", true, updateCoordinatesValuesForm)
    ).AddRadio(
        new RadioInput("cylindrical", "coordinatesType", "цилиндрической", false, updateCoordinatesValuesForm)
    ).AddRadio(
        new RadioInput("spherical", "coordinatesType", "сферической", false, updateCoordinatesValuesForm)
    ).AddChildForm("coordinatesValuesForm")
    .AddChildForm("coordinatesOutputForm");

    updateCoordinatesValuesForm();
}

function updateDisplays(event) {
    const values = (new FormMaker("coordinatesSystemForm")).GetValues();
    const coordinatesOutputFrom = new FormMaker("coordinatesOutputForm");

    const x = coordinatesOutputFrom.GetElement('x_display');
    const y = coordinatesOutputFrom.GetElement('y_display');
    const z = coordinatesOutputFrom.GetElement('z_display');
    const zeta = coordinatesOutputFrom.GetElement('zeta_display');
    const r = coordinatesOutputFrom.GetElement('r_display');
    const phi = coordinatesOutputFrom.GetElement('phi_display');
    const rho = coordinatesOutputFrom.GetElement('rho_display');
    const alpha = coordinatesOutputFrom.GetElement('alpha_display');
    const theta = coordinatesOutputFrom.GetElement('theta_display');

    if (values["coordinatesType"] == "cartesian") {
        zeta.innerText = values['z'] + ' м';
        r.innerText = toScientificNotation(Math.hypot(values['x'], values['y'])) + ' м';
        phi.innerText = toScientificNotation(Math.atan2(values['y'], values['x'])) + ' rad';
        let rhoValue = Math.hypot(values['x'], values['y'], values['z']);
        rho.innerText = toScientificNotation(rhoValue) + ' м';
        alpha.innerText = toScientificNotation(Math.atan2(values['y'], values['x'])) + ' rad';
        theta.innerText = (rhoValue != 0 ? toScientificNotation(Math.acos(values['z'] / rhoValue)) : 0) + ' rad';
    } else if (values["coordinatesType"] == "cylindrical") {
        z.innerText = values['z'] + ' м';
        x.innerText = toScientificNotation(Math.cos(values['phi']) * values['r']) + ' м';
        y.innerText = toScientificNotation(Math.sin(values['phi']) * values['r']) + ' м';
        rho.innerText = toScientificNotation(Math.hypot(values['r'], values['z'])) + ' м';
        alpha.innerText = toScientificNotation(values['phi']) + ' rad';
        theta.innerText = toScientificNotation(Math.acos(values['z'] / Math.hypot(values['r'], values['z']))) + ' rad';
    } else if (values["coordinatesType"] == "spherical") {
        z.innerText = toScientificNotation(values['r'] * Math.sin(values['theta'])) + ' м';
        x.innerText = toScientificNotation(values['r'] * Math.cos(values['theta']) * Math.cos(values['phi'])) + ' м';
        y.innerText = toScientificNotation(values['r'] * Math.cos(values['theta']) * Math.sin(values['phi'])) + ' м';
        r.innerText = toScientificNotation(values['r'] * Math.sin(values['theta'])) + ' м';
        phi.innerText = values['phi'] + ' rad';
        zeta.innerText = toScientificNotation(values['r'] * Math.cos(values['theta'])) + ' м';
    }
}

function updateCoordinatesValuesForm(e) {
    const coordinatesSystemForm = new FormMaker("coordinatesSystemForm");
    const valuesType = coordinatesSystemForm.GetValues()["coordinatesType"];
    const coordinatesValuesFrom = new FormMaker("coordinatesValuesForm").Clear();
    const coordinatesOutputFrom = new FormMaker("coordinatesOutputForm").Clear();

    if (valuesType == "cartesian") {
        coordinatesValuesFrom
        .AddNumber(new NumberInput("x", "x = ", new NumberDomain(0, "м", 0.001), updateDisplays))
        .AddNumber(new NumberInput("y", "y = ", new NumberDomain(0, "м", 0.001), updateDisplays))
        .AddNumber(new NumberInput("z", "z = ", new NumberDomain(0, "м", 0.001), updateDisplays));

        coordinatesOutputFrom.AddParagraph("В цилиндрической системе:")
        .AddDisplay("r_display")
        .AddDisplay("phi_display")
        .AddDisplay("zeta_display")
        .AddParagraph("В сферической системе:")
        .AddDisplay("rho_display")
        .AddDisplay("alpha_display")
        .AddDisplay("theta_display");
    } else if (valuesType == "cylindrical") {
        coordinatesValuesFrom
        .AddNumber(new NumberInput("r", "r = ", new NumberDomain(0, "м", 0.001), updateDisplays))
        .AddNumber(new NumberInput("phi", "phi = ", new NumberDomain(0, "rad", 0.001), updateDisplays))
        .AddNumber(new NumberInput("phi_deg", "", new NumberDomain(0, "deg", 0.001), updateDisplays))
        .AddNumber(new NumberInput("z", "z = ", new NumberDomain(0, "м", 0.001), updateDisplays))
        .ConnectNumbers('phi', 'phi_deg', (x) => { return x / Math.PI * 180; }, (x) => { return x * Math.PI / 180; });

        coordinatesOutputFrom.AddParagraph("В прямоугольной системе:")
        .AddDisplay("x_display")
        .AddDisplay("y_display")
        .AddDisplay("z_display")
        .AddParagraph("В сферической системе:")
        .AddDisplay("rho_display")
        .AddDisplay("alpha_display")
        .AddDisplay("theta_display");
    } else if (valuesType == "spherical") {
        coordinatesValuesFrom
        .AddNumber(new NumberInput("r", "r = ", new NumberDomain(0, "м", 0.001), updateDisplays))
        .AddNumber(new NumberInput("phi", "phi = ", new NumberDomain(0, "rad", 0.001), updateDisplays))
        .AddNumber(new NumberInput("phi_deg", "", new NumberDomain(0, "deg", 0.001), updateDisplays))
        .AddNumber(new NumberInput("theta", "theta = ", new NumberDomain(0, "rad", 0.001), updateDisplays))
        .AddNumber(new NumberInput("theta_deg", "", new NumberDomain(0, "deg", 0.001), updateDisplays))
        .ConnectNumbers('phi', 'phi_deg', (x) => { return x / Math.PI * 180; }, (x) => { return x * Math.PI / 180; })
        .ConnectNumbers('theta', 'theta_deg', (x) => { return x / Math.PI * 180; }, (x) => { return x * Math.PI / 180; });

        
        coordinatesOutputFrom.AddParagraph("В прямоугольной системе:")
        .AddDisplay("x_display")
        .AddDisplay("y_display")
        .AddDisplay("z_display")
        .AddParagraph("В цилиндрической системе:")
        .AddDisplay("r_display")
        .AddDisplay("phi_display")
        .AddDisplay("zeta_display");
    }
    updateDisplays(null, coordinatesSystemForm.GetValues());
}

window.onload = main;

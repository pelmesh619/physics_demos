
class Main {
    main() {
        this.coordinatesSystemForm = new FormMaker("coordinatesSystemForm");
        this.coordinatesOutputForm = new FormMaker("coordinatesOutputForm");
        this.coordinatesValuesForm = new FormMaker("coordinatesValuesForm");

        this.coordinatesSystemForm.AddParagraph("Из системы:")
        .AddRadio(
            new RadioInput("cartesian", "coordinatesType", "прямоугольной", true, this.updateCoordinatesValuesFormFactory())
        ).AddRadio(
            new RadioInput("cylindrical", "coordinatesType", "цилиндрической", false, this.updateCoordinatesValuesFormFactory())
        ).AddRadio(
            new RadioInput("spherical", "coordinatesType", "сферической", false, this.updateCoordinatesValuesFormFactory())
        ).AddInputObject(
            new NumberInputScheme(3, "знак.").Build('eps', "С точностью", this.updateDisplaysFactory())
        ).AddChildForm(this.coordinatesValuesForm)
        .AddChildForm(this.coordinatesOutputForm);

        this.updateCoordinatesValuesForm();
    }

    updateDisplaysFactory() {
        let t = this;
        return () => { t.updateDisplays(); }
    }

    updateCoordinatesValuesFormFactory() {
        let t = this;
        return () => { t.updateCoordinatesValuesForm(); }
    }

    updateDisplays(event) {
        const values = this.coordinatesSystemForm.GetValues();

        const x = this.coordinatesOutputForm.GetElement('x_display');
        const y = this.coordinatesOutputForm.GetElement('y_display');
        const z = this.coordinatesOutputForm.GetElement('z_display');
        const zeta = this.coordinatesOutputForm.GetElement('zeta_display');
        const r = this.coordinatesOutputForm.GetElement('r_display');
        const phi = this.coordinatesOutputForm.GetElement('phi_display');
        const rho = this.coordinatesOutputForm.GetElement('rho_display');
        const alpha = this.coordinatesOutputForm.GetElement('alpha_display');
        const theta = this.coordinatesOutputForm.GetElement('theta_display');
        const eps = values['eps'];

        if (values["coordinatesType"] == "cartesian") {
            zeta.innerText = toScientificNotation(values['z'], eps) + ' м';
            r.innerText = toScientificNotation(Math.hypot(values['x'], values['y']), eps) + ' м';
            phi.innerText = toScientificNotation(Math.atan2(values['y'], values['x']), eps) + ' rad';
            let rhoValue = Math.hypot(values['x'], values['y'], values['z']);
            rho.innerText = toScientificNotation(rhoValue, eps) + ' м';
            alpha.innerText = toScientificNotation(Math.atan2(values['y'], values['x']), eps) + ' rad';
            theta.innerText = toScientificNotation(rhoValue != 0 ? Math.acos(values['z'] / rhoValue) : 0, eps) + ' rad';
        } else if (values["coordinatesType"] == "cylindrical") {
            z.innerText = toScientificNotation(values['z'], eps) + ' м';
            x.innerText = toScientificNotation(Math.cos(values['phi']) * values['r'], eps) + ' м';
            y.innerText = toScientificNotation(Math.sin(values['phi']) * values['r'], eps) + ' м';
            let rhoValue = Math.hypot(values['r'], values['z']);
            rho.innerText = toScientificNotation(rhoValue, eps) + ' м';
            alpha.innerText = toScientificNotation(values['phi'], eps) + ' rad';
            theta.innerText = toScientificNotation(rhoValue != 0 ? Math.acos(values['z'] / rhoValue) : 0, eps) + ' rad';
        } else if (values["coordinatesType"] == "spherical") {
            z.innerText = toScientificNotation(values['r'] * Math.sin(values['theta']), eps) + ' м';
            x.innerText = toScientificNotation(values['r'] * Math.cos(values['theta']) * Math.cos(values['phi']), eps) + ' м';
            y.innerText = toScientificNotation(values['r'] * Math.cos(values['theta']) * Math.sin(values['phi']), eps) + ' м';
            r.innerText = toScientificNotation(values['r'] * Math.sin(values['theta']), eps) + ' м';
            phi.innerText = toScientificNotation(values['phi'], eps) + ' rad';
            zeta.innerText = toScientificNotation(values['r'] * Math.cos(values['theta']), eps) + ' м';
        }
    }

    updateCoordinatesValuesForm(e) {
        const valuesType = this.coordinatesSystemForm.GetValues()["coordinatesType"];
        this.coordinatesValuesForm.Clear();
        this.coordinatesOutputForm.Clear();

        if (valuesType == "cartesian") {
            this.coordinatesValuesForm
            .AddInputObject(new NumberInput("x", "x = ", new NumberInputScheme(0, "м", 0.001), this.updateDisplaysFactory()))
            .AddInputObject(new NumberInput("y", "y = ", new NumberInputScheme(0, "м", 0.001), this.updateDisplaysFactory()))
            .AddInputObject(new NumberInput("z", "z = ", new NumberInputScheme(0, "м", 0.001), this.updateDisplaysFactory()));

            this.coordinatesOutputForm.AddParagraph("В цилиндрической системе:")
            .AddDisplay("r_display")
            .AddDisplay("phi_display")
            .AddDisplay("zeta_display")
            .AddParagraph("В сферической системе:")
            .AddDisplay("rho_display")
            .AddDisplay("alpha_display")
            .AddDisplay("theta_display");
        } else if (valuesType == "cylindrical") {
            this.coordinatesValuesForm
            .AddInputObject(new NumberInput("r", "r = ", new NumberInputScheme(0, "м", 0.001), this.updateDisplaysFactory()))
            .AddInputObject(new NumberInput("phi", "phi = ", new NumberInputScheme(0, "rad", 0.001), this.updateDisplaysFactory()))
            .AddInputObject(new NumberInput("phi_deg", "", new NumberInputScheme(0, "deg", 0.001), this.updateDisplaysFactory()))
            .AddInputObject(new NumberInput("z", "z = ", new NumberInputScheme(0, "м", 0.001)))
            .ConnectNumbers('phi', 'phi_deg', (x) => { return x / Math.PI * 180; }, (x) => { return x * Math.PI / 180; });

            this.coordinatesOutputForm.AddParagraph("В прямоугольной системе:")
            .AddDisplay("x_display")
            .AddDisplay("y_display")
            .AddDisplay("z_display")
            .AddParagraph("В сферической системе:")
            .AddDisplay("rho_display")
            .AddDisplay("alpha_display")
            .AddDisplay("theta_display");
        } else if (valuesType == "spherical") {
            this.coordinatesValuesForm
            .AddInputObject(new NumberInput("r", "r = ", new NumberInputScheme(0, "м", 0.001), this.updateDisplaysFactory()))
            .AddInputObject(new NumberInput("phi", "phi = ", new NumberInputScheme(0, "rad", 0.001), this.updateDisplaysFactory()))
            .AddInputObject(new NumberInput("phi_deg", "", new NumberInputScheme(0, "deg", 0.001)))
            .AddInputObject(new NumberInput("theta", "theta = ", new NumberInputScheme(0, "rad", 0.001), this.updateDisplaysFactory()))
            .AddInputObject(new NumberInput("theta_deg", "", new NumberInputScheme(0, "deg", 0.001)))
            .ConnectNumbers('phi', 'phi_deg', (x) => { return x / Math.PI * 180; }, (x) => { return x * Math.PI / 180; })
            .ConnectNumbers('theta', 'theta_deg', (x) => { return x / Math.PI * 180; }, (x) => { return x * Math.PI / 180; });

            
            this.coordinatesOutputForm.AddParagraph("В прямоугольной системе:")
            .AddDisplay("x_display")
            .AddDisplay("y_display")
            .AddDisplay("z_display")
            .AddParagraph("В цилиндрической системе:")
            .AddDisplay("r_display")
            .AddDisplay("phi_display")
            .AddDisplay("zeta_display");
        }
        this.updateDisplays();
    }
}

window.onload = () => {
    var main = new Main();

    main.main();
};

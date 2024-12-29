use std::io;

fn rectangular_to_polar(x: f64, y: f64) -> (f64, f64) {   
    return (x.hypot(y), y.atan2(x));
}


fn polar_to_rectangular(r: f64, phi: f64) -> (f64, f64) {   
    return (r * phi.cos(), r * phi.sin());
}


fn rectangular_to_cylindrical(coords: (f64, f64, f64)) -> (f64, f64, f64) {
    let (x, y, z) = coords;
    let result = rectangular_to_polar(x, y);
    return (result.0, result.1, z);
}
fn rectangular_to_spherical(coords: (f64, f64, f64)) -> (f64, f64, f64) {
    let (x, y, z) = coords;
    let r = (x * x + y * y + z * z).sqrt();
    let phi = y.atan2(x);
    let theta = (z / r).acos();
    return (r, phi, theta);
}
fn cylindrical_to_rectangular(coords: (f64, f64, f64)) -> (f64, f64, f64) {
    let (r, phi, z) = coords;
    let result = polar_to_rectangular(r, phi);
    return (result.0, result.1, z);
}
fn cylindrical_to_spherical(coords: (f64, f64, f64)) -> (f64, f64, f64) {
    let (r, phi, z) = coords;
    let new_r = r.hypot(z);
    let theta = r.atan2(z);
    return (new_r, phi, theta);
}

fn spherical_to_rectangular(coords: (f64, f64, f64)) -> (f64, f64, f64) {
    let (r, phi, theta) = coords;
    return (r * theta.sin() * phi.cos(), r * theta.sin() * phi.sin(), r * theta.cos());
}
fn spherical_to_cylindrical(coords: (f64, f64, f64)) -> (f64, f64, f64) {
    let (r, phi, theta) = coords;
    let new_r = r * theta.sin();
    let z = r * theta.cos();
    return (new_r, phi, z);
}

fn round_to_digits(x: f64, r: i32) -> f64 {
    return (x * (10.0f64.powi(r))).round() / (10.0f64.powi(r));
}

fn round_pair(x: (f64, f64), r: i32) -> (f64, f64) {
    return (round_to_digits(x.0, r), round_to_digits(x.1, r));
}

fn round_triple(x: (f64, f64, f64), r: i32) -> (f64, f64, f64) {
    return (round_to_digits(x.0, r), round_to_digits(x.1, r), round_to_digits(x.2, r));
}

fn get_number() -> i32 {
    loop {
        let mut string = String::new();
        io::stdin().read_line(&mut string).unwrap();
        match string.trim().parse::<i32>() {
            Err(_) => println!("Your input isn't an integer"),
            Ok(v) => break v
        }
    }
}

fn get_float() -> f64 {
    loop {
        let mut string = String::new();
        io::stdin().read_line(&mut string).unwrap();
        match string.trim().parse::<f64>() {
            Err(_) => println!("Your input isn't a float number"),
            Ok(v) => break v
        }
    }
}

fn tests() {

    let result = rectangular_to_polar(2.0f64, 0.0f64);

    assert_eq!(result, (2.0f64, 0.0f64));
    
    let result = rectangular_to_polar(2.0f64, 2.0f64);

    assert_eq!(round_pair(polar_to_rectangular(result.0, result.1), 2), (2.0f64, 2.0f64));


    let result = rectangular_to_cylindrical((2.0f64, 2.0f64, -5.0f64));

    assert_eq!(round_triple(cylindrical_to_rectangular(result), 2), (2.0f64, 2.0f64, -5.0f64));


    let a = (2.0f64, 2.0f64, -5.0f64);

    let result = rectangular_to_spherical(a);

    assert_eq!(round_triple(spherical_to_rectangular(result), 2), a);

    let a = (2.0f64, 2.0f64, -5.0f64);

    let result = cylindrical_to_spherical(a);

    assert_eq!(round_triple(spherical_to_cylindrical(result), 2), a);

    let a = (3.0f64, 1.57f64, 3.0f64);

    let result = cylindrical_to_spherical(a);

    assert_eq!(round_triple(result, 2), (round_to_digits(3.0f64.hypot(3.0f64), 2), 1.57f64, round_to_digits(3.14f64 / 4.0, 2)));
}

enum CoordinateSystem {
    Rectangular,
    Cylindrical,
    Spherical
}

fn i32_to_enum(i: i32) -> CoordinateSystem {
    match i {
        1 => CoordinateSystem::Rectangular,
        2 => CoordinateSystem::Cylindrical,
        3 => CoordinateSystem::Spherical,
        _ => panic!()
    }
}


fn main() {
    tests();

    println!("Acceptable coordinate systems: \n  1 - rectangular \n  2 - cylindical \n  3 - spherical");
    println!("Enter coordinate system number to translate from: ");
    let first_option = loop {
        let option = get_number();
        if option < 1 || option > 3 {
            println!("Only accepted values are 1, 2 or 3; try again:");
        } else {
            break option
        }
    };
    println!("Enter digit number to round: ");
    let digits_to_round = get_number();
    let first_option_enum = i32_to_enum(first_option);

    let system_names = ["rectangular", "cylindrical", "spherical"];
    let coordinate_names = [["x", "y", "z"], ["r", "phi", "z"], ["r", "phi", "theta"]];
    let is_coordinate_angle = [[false, false, false], [false, true, false], [false, true, true]];


    let first_coordinates = coordinate_names[(first_option - 1) as usize];

    let mut coordinates = [0.0, 0.0, 0.0];
    for i in 0..3 {
        println!("Enter your '{}' coordinate:", first_coordinates[i]);
        coordinates[i] = get_float();
    }

    let coordinates = (coordinates[0], coordinates[1], coordinates[2]);

    println!("Old coordinates: ({3}, {4}, {5})\n{0}: {3}; \n{1}: {4}; \n{2}: {5};", 
        first_coordinates[0], first_coordinates[1], first_coordinates[2],
        coordinates.0, coordinates.1, coordinates.2 
    );

    for i in 1..4 {
        if i == first_option {
            continue;
        }
        let new_coordinates = match first_option_enum {
            CoordinateSystem::Rectangular => match i {
                2 => round_triple(rectangular_to_cylindrical(coordinates), digits_to_round),
                3 => round_triple(rectangular_to_spherical(coordinates), digits_to_round),
                _ => panic!()
            },
            CoordinateSystem::Cylindrical => match i {
                1 => round_triple(cylindrical_to_rectangular(coordinates), digits_to_round),
                3 => round_triple(cylindrical_to_spherical(coordinates), digits_to_round),
                _ => panic!()
            },
            CoordinateSystem::Spherical => match i {
                1 => round_triple(spherical_to_rectangular(coordinates), digits_to_round),
                2 => round_triple(spherical_to_cylindrical(coordinates), digits_to_round),
                _ => panic!()
            }
        };
        let second_coordinates = coordinate_names[(i - 1) as usize];

        println!("Coordinates in {6}: ({3}, {4}, {5})\n{0}: {3}; \n{1}: {4}; {7} \n{2}: {5}; {8}", 
            second_coordinates[0], second_coordinates[1], second_coordinates[2],
            new_coordinates.0, new_coordinates.1, new_coordinates.2, system_names[(i - 1) as usize],
            if is_coordinate_angle[(i - 1) as usize][1] { format!(" ({} degrees)", round_to_digits(new_coordinates.1 / std::f64::consts::PI * 180.0, digits_to_round)) } else { String::new() },
            if is_coordinate_angle[(i - 1) as usize][2] { format!(" ({} degrees)", round_to_digits(new_coordinates.2 / std::f64::consts::PI * 180.0, digits_to_round)) } else { String::new() },
        );
    }

      

    
}



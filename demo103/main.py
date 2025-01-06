import math

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.animation as animation


print('Enter circle radius (by default 1):')
c = input()
if not c or not c.replace('.', '').isdigit():
    CIRCLE_RADIUS = 1
else:
    CIRCLE_RADIUS = float(c)

print('Enter circle velocity (by default 1):')
c = input()
if not c or not c.replace('.', '').isdigit():
    VELOCITY = 1
else:
    VELOCITY = float(c)





def brachistochrone(t, a):
    x = a * (t - np.sin(t))
    y = a * (1 - np.cos(t))
    return x, y



fig, ax = plt.subplots(figsize=(11, 3))
ax.set_xlim(-CIRCLE_RADIUS, math.ceil(2 * math.pi * CIRCLE_RADIUS + CIRCLE_RADIUS))
ax.axhline(0, color='black', lw=0.5, ls='--')
ax.axvline(0, color='black', lw=0.5, ls='--')
ax.grid()


t_brachistochrone = np.linspace(0, np.pi * 2, 1000)
x_brachistochrone, y_brachistochrone = brachistochrone(t_brachistochrone, CIRCLE_RADIUS)
brachistochrone_line, = ax.plot(x_brachistochrone, y_brachistochrone, color='blue')

circle_center_y = CIRCLE_RADIUS
circle = plt.Circle((0, circle_center_y), CIRCLE_RADIUS, edgecolor='red', fill=None)
ax.add_artist(circle)

point, = ax.plot([], [], 'ro')
circle_center_point, = ax.plot([], [], 'go')

def update(frame):
    circle_center_x = frame * CIRCLE_RADIUS
    circle.set_center((circle_center_x, circle_center_y))
    circle_center_point.set_data(circle_center_x, circle_center_y)

    point_x, point_y = brachistochrone(frame, CIRCLE_RADIUS)

    point.set_data(point_x, point_y)


    return circle, point

interval = 200
frames_per_second = 1000 / interval
distance = 2 * np.pi * CIRCLE_RADIUS
time = distance / VELOCITY
total_number_of_frames = int(time * frames_per_second)


ani = animation.FuncAnimation(
    fig,
    update,
    frames=np.linspace(0, 2 * np.pi, total_number_of_frames),
    interval=interval,
    repeat_delay=1000
)

plt.title('Анимация: Круг прокатывается и рисует брахистохрону')
plt.show()

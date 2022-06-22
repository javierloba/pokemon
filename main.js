// ===== BASIC SETTINGS =====
// 1. Seleccionar el canvas del html, darle contexto y medidas
const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = 1024;
canvas.height = 576;

// 2. Obtener las imagenes del mapa, del jugador y del primer plano
const mapImage = new Image();
mapImage.src = './img/map.png';
const foregroundImage = new Image();
foregroundImage.src = './img/foregroundObjects.png';
const playerDownImage = new Image();
playerDownImage.src = './img/playerDown.png';
const playerUpImage = new Image();
playerUpImage.src = './img/playerUp.png';
const playerLeftImage = new Image();
playerLeftImage.src = './img/playerLeft.png';
const playerRightImage = new Image();
playerRightImage.src = './img/playerRight.png';

// 5. Creamos las keys que usaremos en false, sin pulsar
const keys = {
    w: {
        pressed: false
    },
    a: {
        pressed: false
    },
    s: {
        pressed: false
    },
    d: {
        pressed: false
    }
};

// ===== OBSTÁCULOS =====
// 8. Loop para crear el array de obstáculos
const collisionsMap = [];
for (let i = 0; i < collisions.length; i+=70) { // 70 es por las tiles que tiene de largo el mapa
    collisionsMap.push(collisions.slice(i, 70 + i)) // Corta 40 arrays de 70
}

// 10. Crear el loop para pushear las posiciones de los obstáculos en base al array anterior
const boundaries = []
const offset = {
    x: -1648,
    y: -80
}
collisionsMap.forEach((row, i) => {
    row.forEach((symbol, j) => {
        if (symbol === 1063 || symbol === 1216) {
            boundaries.push(
                new Boundary({
                    position: {
                        x: j * Boundary.width + offset.x,
                        y: i * Boundary.height + offset.y
                    }
                })
            )
        }
    })
})

// ===== ZONAS DE BATALLAS =====
// 13. Loop para crear el array de las zonas de batalla
const battleZonesMap = [];
for (let i = 0; i < battleZonesData.length; i+=70) { // 70 es por las tiles que tiene de largo el mapa
    battleZonesMap.push(battleZonesData.slice(i, 70 + i)) // Corta 40 arrays de 70
}

// 14. Crear el loop para pushear las posiciones de las areas de batalla en base al array anterior
const battleZones = []
battleZonesMap.forEach((row, i) => {
    row.forEach((symbol, j) => {
        if (symbol === 1631) {
            battleZones.push(
                new Boundary({
                    position: {
                        x: j * Boundary.width + offset.x,
                        y: i * Boundary.height + offset.y
                    }
                })
            )
        }
    })
})

// ===== SPRITES =====
// 4. Creamos una instancia de Sprite con el mapa, otra con el primer plano y otra con el player
const background = new Sprite({ 
    position: {
        x: offset.x,
        y: offset.y
    },
    image: mapImage
});

const foreground = new Sprite({ 
    position: {
        x: offset.x,
        y: offset.y
    },
    image: foregroundImage
});

const player = new Sprite({
    position: {
        // Ojo, aquí cogemos las medidas del png
        x: canvas.width / 2 - (192 / 4)/2,
        y: canvas.height / 2 - 68 / 2 + 5 // El +5 es para que no toque el borde de la casa al cargar
    },
    image: playerDownImage,
    frames: {
        max: 4,
        hold: 10
    },
    sprites: {
        up: playerUpImage,
        down: playerDownImage,
        left: playerLeftImage,
        right: playerRightImage
    }
})

// ===== MOVIMIENTO Y COLISIONES =====
const movables = [background, ...boundaries, foreground, ...battleZones]
// Función para testear las colisiones entre elementos
function rectangularCollision({ rectangle1, rectangle2}) {
    return (
        rectangle1.position.x + rectangle1.width >= rectangle2.position.x && 
        rectangle1.position.x <= rectangle2.position.x + rectangle2.width &&
        rectangle1.position.y <= rectangle2.position.y + rectangle2.height &&
        rectangle1.position.y + rectangle1.height >= rectangle2.position.y
    )
}

// 16. Objeto battle
const battle = {
    initiated: false
}
audio.Map.play()
// 7. Animation loop
function animate() {
    const animationId = window.requestAnimationFrame(animate);
    // Dibujamos el mapa, los obstáculos, las battlezones, el player y el foreground
    background.draw(); // Llama al método de la clase Sprite
    boundaries.forEach((boundary) => {
        boundary.draw() // Llama al método de la clase Boundary
    })

    battleZones.forEach((battleZone) => {
        battleZone.draw()
    })
    
    player.draw(); // Llama al método de la clase Sprite
    
    foreground.draw(); // Llama al método de la clase Sprite

    let moving = true;
    player.animate = false
    // Impedimos que el resto del código salte cuando inicia una batalla
    if (battle.initiated) return

    // Generamos el movimiento del mapa y los bordes
    // 12. Testeamos las colisiones entre el player y los bordes
    // 15. Activamos las batallas
    if (keys.w.pressed || keys.a.pressed || keys.s.pressed || keys.d.pressed ) {
        for (let i = 0; i < battleZones.length; i++) {
            const battleZone = battleZones[i]
            const overlappingArea = 
                (Math.min(
                    player.position.x + player.width, 
                    battleZone.position.x + battleZone.width
                    ) - 
                Math.max(player.position.x, battleZone.position.x)) *
                    (Math.min(
                        player.position.y + player.height,
                        battleZone.position.y + battleZone.height
                    ) - Math.max(player.position.y, battleZone.position.y))
            if (
                rectangularCollision({
                    rectangle1: player,
                    rectangle2: battleZone
                }) &&
                // Tendrá en cuenta el área del pj que está dentro del battleArea 
                // para que pueda ir por los bordes sin saltar la batalla
                overlappingArea > (player.width * player.height) / 2 &&
                Math.random() < 0.02 // % probabilidad de que salte una batalla
            ) {
                // 16. Entonces desactivamos el animation loop del mapa
                window.cancelAnimationFrame(animationId)

                audio.Map.stop()
                audio.initBattle.play()
                audio.battle.play()

                battle.initiated = true
                gsap.to('#overlappingDiv', {
                    opacity: 1,
                    repeat: 3,
                    yoyo: true,
                    duration: 0.4,
                    onComplete() {
                        gsap.to('#overlappingDiv', {
                            opacity: 1,
                            duration: 0.4,
                            onComplete() {
                                // 17. Y activamos nuevo animation loop de batallas
                                initBattle()
                                animateBattle()
                                gsap.to('#overlappingDiv', {
                                    opacity: 0,
                                    duration: 0.4
                                })
                            }
                        })
                    }
                })
                break
            }
        }
    }

    if (keys.w.pressed && lastKey === 'w') {
        player.animate = true
        player.image = player.sprites.up
        for (let i = 0; i < boundaries.length; i++) {
            const boundary = boundaries[i]
            if (
                rectangularCollision({
                    rectangle1: player,
                    rectangle2: {
                        ...boundary,
                        position: {
                            x: boundary.position.x,
                            y: boundary.position.y + 3
                        }
                    }
                })
            ) {
                moving = false
                break
            }
        }

        if(moving){
            movables.forEach((movable) => {
                movable.position.y += 3
            })
        }

    } else if (keys.s.pressed && lastKey === 's') {
        player.animate = true
        player.image = player.sprites.down
        for (let i = 0; i < boundaries.length; i++) {
            const boundary = boundaries[i]
            if (
                rectangularCollision({
                    rectangle1: player,
                    rectangle2: {
                        ...boundary,
                        position: {
                            x: boundary.position.x,
                            y: boundary.position.y - 3
                        }
                    }
                })
            ) {
                moving = false
                break
            }
        }
        if(moving){
            movables.forEach((movable) => {
                movable.position.y -= 3
            })
        }
    } else if (keys.a.pressed && lastKey === 'a') {
        player.animate = true
        player.image = player.sprites.left
        for (let i = 0; i < boundaries.length; i++) {
            const boundary = boundaries[i]
            if (
                rectangularCollision({
                    rectangle1: player,
                    rectangle2: {
                        ...boundary,
                        position: {
                            x: boundary.position.x + 3,
                            y: boundary.position.y
                        }
                    }
                })
            ) {
                moving = false
                break
            }
        }
        if(moving){
            movables.forEach((movable) => {
                movable.position.x += 3
            })
        }
    }  else if (keys.d.pressed && lastKey === 'd') {
        player.animate = true
        player.image = player.sprites.right
        for (let i = 0; i < boundaries.length; i++) {
            const boundary = boundaries[i]
            if (
                rectangularCollision({
                    rectangle1: player,
                    rectangle2: {
                        ...boundary,
                        position: {
                            x: boundary.position.x - 3,
                            y: boundary.position.y
                        }
                    }
                })
            ) {
                moving = false
                break
            }
        }
        if(moving){
            movables.forEach((movable) => {
                movable.position.x -= 3
            })
        }
    }
};

// ===== TECLAS =====
// 6. Reconocer la pulsación de teclas
let lastKey = '';
window.addEventListener('keydown', (e) => {
    switch(e.key.toLocaleLowerCase()) {
        case 'w':
            keys.w.pressed = true;
            lastKey = 'w';
            break;
        case 'a':
            keys.a.pressed = true;
            lastKey = 'a';
            break;
        case 's':
            keys.s.pressed = true;
            lastKey = 's';
            break;
        case 'd':
            keys.d.pressed = true;
            lastKey = 'd';
            break;
    };
});

window.addEventListener('keyup', (e) => {
    switch(e.key.toLocaleLowerCase()) {
        case 'w':
            keys.w.pressed = false
            break
        case 'a':
            keys.a.pressed = false
            break
        case 's':
            keys.s.pressed = false
            break
        case 'd':
            keys.d.pressed = false
            break
    };
});

// ===== AUDIO =====

// let clicked = true
// addEventListener('click', () => {
//     if (clicked) {
//         audio.Map.play()
//         clicked = true
//     }
// })

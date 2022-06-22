const battleBackgroundImage = new Image();
battleBackgroundImage.src = './img/battleBackground.png';
const battleBackground = new Sprite({
    position: {
        x: 0,
        y: 0
    },
    image: battleBackgroundImage
})

let draggle 
let emby
let renderedSprites
let battleAnimationId
// 23. Creamos la cola de ataques
let queue

// 18. Animation loop para las batallas
// 29. Metemos todo lo necesario para iniciar las batallas en una función
function initBattle() {
    document.querySelector('#userInterface').style.display = 'block'
    document.querySelector('.battle-background').style.display = 'flex'
    document.querySelector('#dialogueBox').style.display = 'none'
    document.querySelector('#enemyHealthBar').style.width = '100%'
    document.querySelector('#playerHealthBar').style.width = '100%'
    document.querySelector('#attacksBox').replaceChildren()

    draggle = new Monster(monsters.Draggle)
    emby = new Monster(monsters.Emby)
    renderedSprites = [ draggle, emby ]
    queue = []

    // 25. Populamos los ataques con sus nombres en los botones
    emby.attacks.forEach((attack) => {
        const button = document.createElement('button')
        button.innerHTML = attack.name
        document.querySelector('#attacksBox').append(button)
    })

    

    // 19. Añadimos event listeners a los botones de los ataques
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', (e) => {
            const selectedAttack = attacks[e.currentTarget.innerHTML] // Selecciona el nombre del botón
            emby.attack({ 
                attack: selectedAttack,
                recipient: draggle,
                renderedSprites
            })

            // 27. El enemigo pierde
            if (draggle.health <= 0) {
                queue.push(() => {
                    draggle.faint()
                })
                queue.push(() => {
                    //28. pantalla en negro y volvemos a la pantalla del mapa
                    gsap.to('#overlappingDiv', {
                        opacity: 1,
                        onComplete: () => {
                            cancelAnimationFrame(battleAnimationId)
                            animate()
                            document.querySelector('#userInterface').style.display = 'none'
                            document.querySelector('.battle-background').style.display = 'none'
                            gsap.to('#overlappingDiv', {
                                opacity: 0
                            })
                            battle.initiated = false
                            audio.Map.play()
                        }
                    })
                })
            }
            // 24. Metemos el ataque del enemigo
            const randomAttack = draggle.attacks[Math.floor(Math.random() * draggle.attacks.length)]
            queue.push(() => {
                draggle.attack({ 
                    attack: randomAttack, // Con esto lo randomizamos del array de ataques
                    recipient: emby,
                    renderedSprites
                })
                // Nosotros perdemos
                if (emby.health <= 0) {
                    queue.push(() => {
                        emby.faint()
                    })
                    queue.push(() => {
                        //28. pantalla en negro y volvemos a la pantalla del mapa
                        gsap.to('#overlappingDiv', {
                            opacity: 1,
                            onComplete: () => {
                                cancelAnimationFrame(battleAnimationId)
                                animate()
                                document.querySelector('#userInterface').style.display = 'none'
                                gsap.to('#overlappingDiv', {
                                    opacity: 0
                                })
                                battle.initiated = false
                                audio.Map.play()
                            }
                        })
                    })
                }
            })
        })

        // 26. Mostrar el tipo de ataque
        button.addEventListener('mouseenter', (e) => {
            const selectedAttack = attacks[e.currentTarget.innerHTML]
            document.querySelector('#attackType').innerHTML = selectedAttack.type
            document.querySelector('#attackType').style.color = selectedAttack.color
        })
    })
}

function animateBattle() {
    battleAnimationId = window.requestAnimationFrame(animateBattle)
    battleBackground.draw()
    renderedSprites.forEach((sprite) => {
        sprite.draw()
    })
}

animate()
// initBattle()
// animateBattle()

// 22. Pasamos al cuadro de dialogo cuando clickemos en los atackes
document.querySelector('#dialogueBox').addEventListener('click', (e) => {
    if (queue.length > 0) {
        queue[0]()
        queue.shift()
    } else e.currentTarget.style.display = 'none'
})
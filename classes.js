// 3. Crear una clase para los sprites
class Sprite {
    constructor({ 
        position, 
        velocity,
        image, 
        frames = { max: 1, hold: 10 }, 
        sprites, 
        animate = false,
        rotation = 0
     }) {
        this.position = position;
        this.image = new Image();
        this.frames = {...frames, val: 0, elapsed: 0};
        this.image.onload = () => {
            this.width = this.image.width / this.frames.max
            this.height = this.image.height
        }
        this.image.src = image.src
        this.animate = animate;
        this.sprites = sprites;
        this.opacity = 1
        this.rotation = rotation
    };

    draw() {
        c.save()
        // Aquí calculamos de donde sale la animación de la fireball
        c.translate(this.position.x + (this.width/2), this.position.y + (this.height/2))
        // Le pasamos la rotación
        c.rotate(this.rotation)
        // Y evitamos que toda la pantalla se gire
        c.translate(-this.position.x - (this.width/2), -this.position.y - (this.height/2))
        c.globalAlpha = this.opacity
        c.drawImage(
            this.image,
            this.frames.val * this.width, // inicio recorte x
            0, // inicio recorte y
            this.image.width / this.frames.max, // final recorte x
            this.image.height, // final recorte y
            this.position.x, // posición x
            this.position.y, // posición y
            this.image.width / this.frames.max, // medida renderización x
            this.image.height // medida renderización y
        );
        c.restore()

        if (!this.animate) return // Aquí saltará el movimiento del sprite
        if (this.frames.max > 1) {
            this.frames.elapsed++
        }
        if (this.frames.elapsed % this.frames.hold === 0) {
            if (this.frames.val < this.frames.max - 1) this.frames.val++
            else this.frames.val = 0
        }
    };
};

// 25. Creamos la clase para los monstruos y los ataques
class Monster extends Sprite {
    constructor({
        position, 
        velocity,
        image, 
        frames = { max: 1, hold: 10 }, 
        sprites = [], 
        animate = false,
        rotation = 0,
        isEnemy = false,
        name,
        attacks
    }) {
        super({
            position, 
            velocity,
            image, 
            frames, 
            sprites, 
            animate,
            rotation,
        })
        this.health = 100
        this.isEnemy = isEnemy
        this.name = name
        this.attacks = attacks
    }

    // 28. Creamos el método faint
    faint() {
        document.querySelector('#dialogueBox').innerHTML = this.name + ' fainted!'
        gsap.to(this.position, {
            y: this.position.y + 20
        })
        gsap.to(this, {
            opacity: 0
        })
        audio.battle.stop()
        audio.victory.play()
    }
    // 20. Creamos el método attack
    attack({ attack, recipient, renderedSprites }) {
        // 21. Sacamos el dialogo auxiliar y le cambiamos el display
        document.querySelector('#dialogueBox').style.display = 'block'
        document.querySelector('#dialogueBox').innerHTML = this.name + ' used ' + attack.name

        let healthBar = '#enemyHealthBar'
        if (this.isEnemy) healthBar = '#playerHealthBar'

        // Añadimos la rotación para la fireball
        let rotation = 1
        if (this.isEnemy) rotation = -2.3

        recipient.health -= attack.damage

        switch (attack.name) {
            case 'Fireball':
                audio.initFireball.play()
                const fireballImage = new Image()
                fireballImage.src = './img/fireball.png'
                const fireball = new Sprite({
                    position: {
                        x: this.position.x,
                        y: this.position.y
                    },
                    image: fireballImage,
                    frames: {
                        max: 4,
                        hold: 10
                    },
                    animate: true,
                    rotation
                })

                renderedSprites.splice(1, 0, fireball)

                gsap.to(fireball.position, {
                    x: recipient.position.x,
                    y: recipient.position.y,
                    onComplete: () => {
                        // Aquí es cuando golpea
                        audio.fireballHit.play()
                        gsap.to(healthBar, {
                            width: recipient.health + '%'
                        })
        
                        gsap.to(recipient.position, {
                            x: recipient.position.x + 10,
                            yoyo: true,
                            repeat: 5,
                            duration: 0.08
                        })
                        gsap.to(recipient, {
                            opacity: 0.2,
                            repeat: 5,
                            yoyo: true,
                            duration: 0.08
        
                        })
                        // Y sacamos el ataque del array
                        renderedSprites.splice(1, 1)
                    }
                })

            break;
            case 'Tackle':
                const tl = gsap.timeline()
        
                let movementDistance = 20
                if(this.isEnemy) movementDistance = -20
        
                tl.to(this.position, {
                    x: this.position.x - movementDistance
                }).to(this.position, {
                    x: this.position.x + movementDistance * 2,
                    duration: .1,
                    onComplete: () => {
                        // Aquí es cuando golpea
                        audio.tackleHit.play()
                        gsap.to(healthBar, {
                            width: recipient.health + '%'
                        })
        
                        gsap.to(recipient.position, {
                            x: recipient.position.x + 10,
                            yoyo: true,
                            repeat: 5,
                            duration: 0.08
                        })
                        gsap.to(recipient, {
                            opacity: 0.2,
                            repeat: 5,
                            yoyo: true,
                            duration: 0.08
        
                        })
                    }
                }).to(this.position, {
                    x: this.position.x
                })
            break;
        }
    }
}

// 9. Crear una clase para los bordes en los que colisiona el personaje
class Boundary {
    static width = 48
    static height = 48

    constructor({ position }) {
        this.position = position
        // Ojo, 48 es 12x4 ya que hicimos las celdas de 12px x 12px,
        // pero ampliamos a 400% el zoom del mapa
        this.width = 48
        this.height = 48
    }

    draw() {
        c.fillStyle = 'rgba(0, 0, 0, 0)'
        c.fillRect(this.position.x, this.position.y,this.width, this.height)
    }
}
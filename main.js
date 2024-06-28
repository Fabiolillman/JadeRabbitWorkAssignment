window.addEventListener("load", async () => {
    await loadAssets();

    let appInstances = [];
    let animationStatus = [];
    let finalImages = [];
    let winMessageDisplayed = false;
    let winAnimationTimeout = null;
    let cheatInProgress = false;

    function initializeSlotMachine() {
        appInstances.forEach(app => {
            app.destroy(true);
        });
        appInstances = [];
        animationStatus = [];
        finalImages = [];
        winMessageDisplayed = false;

        for (let i = 1; i <= 3; i++) {
            const reel = document.getElementById(`reel${i}`);
            if (!reel) continue;
            // clear reel
            reel.innerHTML = "";
            const appInstance = new PIXI.Application({
                width: 200, height: 200, backgroundColor: "#EEE84C",
            });
            reel.appendChild(appInstance.view);
            appInstances.push(appInstance);
            animationStatus.push({ running: true, finalLap: false, stopImage: null });
            setTimeout(() => run(appInstance, animationStatus[i - 1], finalImages, i - 1), i * 200);
        }
    }

    function loadAssets() {
        return PIXI.Assets.load("assets.json");
    }

    function run(instance, status, finalImages, reelIndex) {
        if (!instance || !instance.stage) return;

        const images = ["Low1.png", "Low2.png", "Low3.png", "Low4.png", "High1.png", "High2.png", "High3.png", "High4.png"];
        const textures = images.map(img => PIXI.Texture.from(img));
        const container = new PIXI.Container();
        instance.stage.addChild(container);

        textures.forEach((texture, index) => {
            const sprite = new PIXI.Sprite(texture);
            sprite.y = index * 200;
            sprite.x = -25;
            container.addChild(sprite);
        });

        const mask = new PIXI.Graphics();
        mask.beginFill(0xffffff).drawRect(0, 0, 200, 200).endFill();
        container.mask = mask;
        instance.stage.addChild(mask);
        container.y = -200;

        instance.ticker.add(() => {
            if (status.running) {
                container.y += 10;
                if (container.y >= 0) container.y = -200 * (textures.length - 1);
                if (status.finalLap && container.y === -200) {
                    status.running = false;
                    container.y = 0;
                    container.children[0].texture = status.stopImage;
                    finalImages[reelIndex] = status.stopImage.textureCacheIds[0];
                    if (finalImages.length === 3 && finalImages.every(img => img)) checkWinCondition(finalImages);
                }
            }
        });
    }

    function checkWinCondition(finalImages) {
        if (finalImages.every(img => img === finalImages[0]) && !winMessageDisplayed) {
            document.getElementById("winMessage").textContent = "You've won!";
            winMessageDisplayed = true;
            winAnimationTimeout = setTimeout(() => {
                appInstances.forEach(startWinAnimation);
                document.getElementById("spinButton").disabled = false;
            }, 2000);
        }
    }

    function startWinAnimation(instance) {
        if (!instance || !instance.stage) return;
        // clear children
        const frames = Array.from({ length: 25 }, (_, i) => PIXI.Texture.from(`WinsweepBox${i.toString().padStart(2, '0')}.png`));
        instance.stage.removeChildren();

        const sprite = new PIXI.Sprite(frames[0]);
        sprite.anchor.set(0.5);
        sprite.position.set(instance.screen.width / 2, instance.screen.height / 2);

        instance.stage.addChild(sprite);

        let animationIndex = 0;
        instance.ticker.add(() => {
            if (!instance || !instance.stage) return;
            sprite.texture = frames[animationIndex++ % frames.length];
        });

        instance.ticker.maxFPS = 3.33;
    }

    function resetSlotMachine() {
        stopIndex = 0;
        initializeSlotMachine();
        document.getElementById("winMessage").textContent = "";
        document.getElementById("cheatButton").style.display = "inline-block";
        document.getElementById("stopButton").style.display = "inline-block";
        clearTimeout(winAnimationTimeout);
    }

    initializeSlotMachine();

    document.getElementById("spinButton").addEventListener("click", () => {
        if (!cheatInProgress) {
            resetSlotMachine();
        }
    });

    let stopIndex = 0;
    document.getElementById("stopButton").addEventListener("click", () => {
        if (stopIndex < appInstances.length && animationStatus[stopIndex].running) {
            const images = ["Low1.png", "Low2.png", "Low3.png", "Low4.png", "High1.png", "High2.png", "High3.png", "High4.png"];
            animationStatus[stopIndex].finalLap = true;
            animationStatus[stopIndex++].stopImage = PIXI.Texture.from(images[Math.floor(Math.random() * images.length)]);
            document.getElementById("cheatButton").style.display = "none";
        }
    });

    document.getElementById("cheatButton").addEventListener("click", () => {
        cheatInProgress = true;
        const cheatImage = PIXI.Texture.from("High1.png");
        (function stopReelSequentially(reelIndex) {
            if (reelIndex < appInstances.length) {
                animationStatus[reelIndex].finalLap = true;
                animationStatus[reelIndex].stopImage = cheatImage;
                finalImages[reelIndex] = "High1.png";
                setTimeout(() => {
                    stopReelSequentially(reelIndex + 1);
                    if (reelIndex === appInstances.length - 1) {
                        cheatInProgress = false;
                        document.getElementById("spinButton").disabled = true;
                    }
                }, 1000);
                document.getElementById("stopButton").style.display = "none";
            } else {
                setTimeout(() => {
                    checkWinCondition(finalImages);
                    if (finalImages.every(img => img)) {
                        document.getElementById("spinButton").disabled = true;
                    }
                }, 1000);
            }
        })(0);
    });
});

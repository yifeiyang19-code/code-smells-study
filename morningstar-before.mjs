export default class HealthPackFeedback {
  constructor(scene) { this.scene = scene; }
  flashHeal(x, y, amount) {
    const scene = this.scene;
    const text = scene.add.text(x, y - 32, `+${amount} HP`, {
      fontFamily: "monospace",
      fontSize: "24px",
      color: "#b8ffd6",
      stroke: "#00190a",
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(2000);

    scene.tweens.add({
      targets: text,
      y: y - 70,
      alpha: 0,
      duration: 720,
      ease: "Quad.easeOut",
      onComplete: () => text.destroy()
    });
  }

  flashFull(x, y) {
    const scene = this.scene;
    const text = scene.add.text(x, y - 32, "HP FULL", {
      fontFamily: "monospace",
      fontSize: "20px",
      color: "#e8fff1",
      stroke: "#00190a",
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(2000);

    scene.tweens.add({
      targets: text,
      y: y - 58,
      alpha: 0,
      duration: 420,
      ease: "Quad.easeOut",
      onComplete: () => text.destroy()
    });
  }

}

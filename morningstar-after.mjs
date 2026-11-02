export default class HealthPackFeedback {
  constructor(scene) { this.scene = scene; }

  flashHeal(x, y, amount) {
    this.flashMessage(x, y, `+${amount} HP`, {
      fontSize: "24px", color: "#b8ffd6", strokeThickness: 5,
      rise: 70, duration: 720
    });
  }

  flashFull(x, y) {
    this.flashMessage(x, y, "HP FULL", {
      fontSize: "20px", color: "#e8fff1", strokeThickness: 4,
      rise: 58, duration: 420
    });
  }

  flashMessage(x, y, message, style) {
    const scene = this.scene;
    const text = scene.add.text(x, y - 32, message, {
      fontFamily: "monospace",
      fontSize: style.fontSize,
      color: style.color,
      stroke: "#00190a",
      strokeThickness: style.strokeThickness
    }).setOrigin(0.5).setDepth(2000);

    scene.tweens.add({
      targets: text,
      y: y - style.rise,
      alpha: 0,
      duration: style.duration,
      ease: "Quad.easeOut",
      onComplete: () => text.destroy()
    });
  }
}

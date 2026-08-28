export type CompanionState =
  | "IDLE"
  | "MOVING"
  | "ARRIVING"
  | "SITTING"
  | "SEATED_IDLE"
  | "STANDING";

const ALLOWED_TRANSITIONS: Record<CompanionState, readonly CompanionState[]> = {
  IDLE: ["MOVING"],
  MOVING: ["ARRIVING"],
  ARRIVING: ["SITTING"],
  SITTING: ["SEATED_IDLE"],
  SEATED_IDLE: ["STANDING"],
  STANDING: ["MOVING"],
};

export class CompanionAnimationMachine {
  state: CompanionState = "IDLE";
  enteredAt = 0;

  transition(next: CompanionState, now: number) {
    if (next === this.state) return false;
    if (!ALLOWED_TRANSITIONS[this.state].includes(next)) return false;
    const previous = this.state;
    this.state = next;
    this.enteredAt = now;
    if (process.env.NODE_ENV === "development") {
      console.info("[CompanionCat] state transition", { previous, next });
    }
    return true;
  }

  requestMovement(now: number) {
    if (this.state === "IDLE") return this.transition("MOVING", now);
    if (this.state === "SEATED_IDLE") return this.transition("STANDING", now);
    return this.state === "MOVING" || this.state === "STANDING";
  }
}


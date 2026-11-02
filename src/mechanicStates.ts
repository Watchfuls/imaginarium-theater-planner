// State definitions are universal; accompanying encounter effects are separate.
export function mechanicStateDescription(state:string,_enemyIds:string[]=[]):string {
  if(/grief-stricken/i.test(state))return 'Damage reduces maximum HP. After ordinary HP is depleted, the Hunter cannot act; an early Ascendant Gleam trigger allows it to keep attacking.';
  if(/exhaust/i.test(state))return 'A recovery state in which the enemy cannot perform actions.';
  if(/weaken/i.test(state))return 'Resistance is reduced.';
  if(/disabl/i.test(state))return 'The affected weak-point system is inactive and cannot be used for its associated attacks.';
  if(/paraly|stun/i.test(state))return 'The enemy cannot perform actions.';
  if(/interrupt/i.test(state))return 'The current attack is canceled.';
  return '';
}

// Phase gates. The build goes one aspect at a time: patient and specialist first,
// made solid, then laboratories, then pharmacies. Flip a flag to switch a module on.
export const FEATURES: { lab: boolean; pharmacy: boolean } = {
  lab: false,
  pharmacy: false,
};

export const PRODUCT = "AfyaConnect";

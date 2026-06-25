# Commercial Pricing Models & Calculations

This document specifies the algebraic pricing models used within the interactive subscription estimators and dynamic price sheets of BhoomiOne.

---

## 📈 Interactive Pricing Slabs Calculations

BhoomiOne incorporates interactive pricing estimation sliding scales:

* **Subscription Base Cost**: Derived from selected Plan Slabs ($P_{\text{base}}$).
* **Volumetric Sliders Adder**: Calculates cost modifiers based on requested plot count scale limits ($L_{\text{plots}}$) and custom add-on counts ($A_k$):
  $$P_{\text{total}} = P_{\text{base}} + \sum A_k + f(L_{\text{plots}})$$

---

## 📐 Plot Pricing Slabs Modifiers

For cadastral parcel plots, premium price sheets use local modifiers:
* **Base Plot Price**: Mapped from general layout square footage rates ($C_{\text{sqft}} \cdot \text{Area}$).
* **Corner Plot Premium Adder**: $+15\%$ base price multiplier ($P_{\text{corner}} = 1.15 \cdot P_{\text{base}}$).
* **Road Facing Premium Adder**: $+10\%$ base price multiplier ($P_{\text{road}} = 1.10 \cdot P_{\text{base}}$).
* **Amenity Facing Premium Adder**: $+8\%$ base price multiplier ($P_{\text{amenity}} = 1.08 \cdot P_{\text{base}}$).
* **Overlapped boundaries safety limits**: If parcel boundaries calculation reports overlapping spatial elements, the pricing engine disables automatic reservation options until the surveyor resolves the conflict.

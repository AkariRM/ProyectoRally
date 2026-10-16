# Revisión del documento "Problema" — puntos para Bioquímica

La app ya sigue el documento: la fórmula de 150 g, los procesos (secado, escamas de 2–3 mm, pirólisis y molienda), las esferas de 2–3 cm, el inóculo, las especies y el balance de masa. Al pasar los números a la app aparecieron estas inconsistencias. Conviene corregirlas en el documento.

## 1. Porcentajes de la fórmula vs. gramos

- El documento dice **biochar 55 %, harina 30 %, compost 15 %** (suma 100 %).
- Pero los gramos para 150 g son **52.5 + 45 + 22.5 = 120 g**, más **30 g de pasta aglutinante** = 150 g.
- Con esos gramos los porcentajes reales son: **biochar 35 %, harina 30 %, compost 15 %, pasta 20 %**.
- Con 55 % el biochar serían 82.5 g, no 52.5 g.

**En la app:** la fórmula base usa los **gramos** (35 / 30 / 15 / 20 %), que es lo que se pesa en la práctica. Si el 55 % era el correcto, edita la fórmula en **Inicio → Catálogos → Fórmulas**.

## 2. Desglose de la harina de pasto

Las operaciones de la harina usan **52.5 g** (la masa del biochar) en lugar de **45 g**. Además pone "celulosa 52.5 g × 0.00 = 0 g", aunque en los totales usa **15.75 g** de celulosa para la harina (= 45 g × 0.35).

**En la app:** fracciones de la harina = celulosa 0.35, hemicelulosa/pectinas 0.30, lignina 0.15, polifenoles 0.03. Se dedujeron de los totales del documento.

## 3. Lignina del compost

El texto dice **X = 0.35**, pero la operación usa **× 0.15** (22.5 g × 0.15 = 3.375 g), y en los totales aparece **7.875 g**.

**En la app:** 0.35 (el valor declarado).

## 4. Lignina del biochar

En el desglose: 52.5 g × 0.15 = **7.875 g**. En los totales se suma **12.375 g**.

## 5. Resultado final

Con las fracciones registradas, la app calcula para la fórmula de 150 g:

| Componente | Documento | App (balance de masa) |
|---|---|---|
| Celulosa | 12 % | **12 %** (18 g) |
| Hemicelulosa / pectinas | 11.25 % | **11.25 %** (16.88 g) |
| Lignina | 18 % | **15 %** (22.5 g) |
| Polifenoles / taninos | 3.5 % | **3.45 %** (5.18 g) |

La diferencia en lignina viene de los puntos 3 y 4.

## 6. Pasta aglutinante

No tiene composición en el documento, así que no aporta al balance. Cuando se defina (por ejemplo, arcilla + agua, almidón o mucílago de nopal), regístrala en **Catálogos → Ingredientes → Pasta aglutinante húmeda**.

## 7. Arcilla

El concepto menciona **arcilla local** como base de la esfera, pero la fórmula de 150 g no la incluye. Hay que aclarar si la pasta aglutinante es la arcilla, o si la arcilla va aparte. La app tiene las dos fórmulas: la del documento y la "bola de arcilla con escamas de ficus".

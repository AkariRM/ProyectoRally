# Revisión del documento "Problema" — puntos para Bioquímica

La app usa **solo los valores del documento** para hacer las píldoras:

- **Fórmulas:**
  - "Receta de 150 g del documento": 52.5 g de biochar de ramas de ficus, 45 g de harina de pasto y hojas, 22.5 g de compost de hojas y 30 g de pasta aglutinante húmeda.
  - "Composición del documento": biochar 55 %, harina 30 %, compost 15 %.
- **Ingredientes:** los de las fórmulas, más escamas de ficus, arcilla local y compost maduro o humus.
- **Inóculo:** micorrizas de suelo forestal o bacterias benéficas.
- **Proceso:**
  - Hojas secas y ramillas tiernas secadas al sol y trituradas a escamas de 2–3 mm.
  - Ramas convertidas en biochar por pirólisis a más de 450 °C sin oxígeno.
  - Pasto y hojas molidos a harina.
  - Esferas de 2–3 cm, secadas a la sombra.
- **Balance de masa:** se usan las cantidades de la "Integración Cuantitativa". Con la receta de 150 g la app da los mismos resultados que el documento:

| Componente | Documento | App |
|---|---|---|
| Celulosa | 12 % | 12 % (18 g) |
| Lignina y estructuras equivalentes | 18 % | 18 % (27 g) |
| Polisacáridos complejos y pectinas | 11.25 % | 11.25 % (16.88 g) |
| Polifenoles, taninos y flavonoides | 3.5 % | 3.5 % (5.25 g) |

## Inconsistencias que conviene corregir en el documento

1. **Composición vs. receta.** Biochar 55 % / harina 30 % / compost 15 % no coincide con los gramos de la receta de 150 g: 52.5 g de biochar es 35 % de 150 g, y con 55 % serían 82.5 g. Por eso la app tiene las dos fórmulas por separado.
2. **Harina de pasto.** El desglose multiplica 52.5 g (la masa del biochar) en lugar de 45 g, y pone celulosa × 0.00. Los totales usan 15.75 g de celulosa (45 g × 0.35). La app usa los totales.
3. **Lignina del compost.** El texto dice X = 0.35, la operación usa × 0.15 (3.375 g) y los totales usan 7.875 g (= 22.5 g × 0.35). La app usa 0.35.
4. **Lignina del biochar.** El desglose da 7.875 g (× 0.15) y los totales usan 12.375 g. La app usa 12.375 g (fracción 0.2357), que es lo que lleva al 18 % final.
5. **Pasta aglutinante.** No tiene composición en el documento, así que no aporta al balance de masa.
6. **Arcilla.** El concepto menciona arcilla local, pero la receta de 150 g no la incluye.
7. **Peso de cada esfera.** El documento solo da el diámetro (2–3 cm). En la app se cuenta cuántas esferas salieron o se pesa una.

Si Bioquímica corrige un valor, se cambia en **Inicio → Catálogos → Ingredientes / Fórmulas**, sin tocar código.

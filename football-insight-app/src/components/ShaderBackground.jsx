import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";

export default function ShaderBackground() {
  return (
    <div className="shaderBg" aria-hidden="true">
      <ShaderGradientCanvas
        style={{ position: "absolute", inset: 0 }}
        pixelDensity={1}   // tienilo basso per performance (free + mobile)
        fov={45}
      >
        <ShaderGradient
          control="query"
          // incolla qui la URL che hai copiato da shadergradients.com
          urlString="INCOLLA_QUI_LA_TUA_URL_DI_SHADERGRADIENT"
        />
      </ShaderGradientCanvas>
    </div>
  );
}

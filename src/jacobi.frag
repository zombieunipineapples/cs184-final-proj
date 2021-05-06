precision highp float;
uniform sampler2D xTex;
uniform sampler2D bTex;
uniform float alpha;
uniform float inverseBeta;
uniform vec2 inverseCanvasSize;

void main()
{
    vec2 coord = gl_FragCoord.xy * inverseCanvasSize;
    
    float xL = texture2D(xTex, coord - inverseCanvasSize * vec2(1.0, 0.0)).r;
    float xR = texture2D(xTex, coord + inverseCanvasSize * vec2(1.0, 0.0)).r;
    float xB = texture2D(xTex, coord - inverseCanvasSize * vec2(0.0, 1.0)).r;
    float xT = texture2D(xTex, coord + inverseCanvasSize * vec2(0.0, 1.0)).r;
    float bC = texture2D(bTex, coord).r;
    
    gl_FragColor = vec4((xL + xR + xB + xT + alpha * bC) * inverseBeta, 0.0, 0.0, 0.0);
}
precision highp float;
uniform sampler2D toAdvectTexture;
uniform sampler2D velocityTexture;
uniform float dt;
uniform vec2 inverseCanvasSize;
uniform bool isVelocity;

vec4 f4texRECTbilerp(sampler2D tex, vec2 s)
{
    vec4 st;
    st.xy = floor(s - 0.5) + 0.5;
    st.zw = st.xy + 1.0;
    
    vec2 t = s - st.xy;
    
    vec4 tex11 = texture2D(tex, st.xy * inverseCanvasSize);
    vec4 tex21 = texture2D(tex, st.zy * inverseCanvasSize);
    vec4 tex12 = texture2D(tex, st.xw * inverseCanvasSize);
    vec4 tex22 = texture2D(tex, st.zw * inverseCanvasSize);
    
    return mix(mix(tex11, tex21, t.x), mix(tex12, tex22, t.x), t.y);
}

void main()
{
    vec2 pos = gl_FragCoord.xy - dt * texture2D(velocityTexture, gl_FragCoord.xy * inverseCanvasSize).xy;
    gl_FragColor = f4texRECTbilerp(toAdvectTexture, pos);
}
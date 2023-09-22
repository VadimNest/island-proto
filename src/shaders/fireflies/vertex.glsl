uniform float uPixelRatio;
uniform float uSize;
uniform float uTime;

attribute float atrScale;


void main() {
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  modelPosition.y += sin(uTime + modelPosition.x * 100.0) * atrScale * 0.2;

  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectionPosition = projectionMatrix * viewPosition;

  gl_Position = projectionPosition;

  gl_PointSize = uSize * atrScale * uPixelRatio;
  gl_PointSize *= (1.0 / -viewPosition.z);
}

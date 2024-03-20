import { createRoot } from "react-dom/client";
let element = (
    <h1 id="container">
        hello<span style={{ color: 'red' }}>world</span>
    </h1>
)
console.log(element);
const root = createRoot(document.getElementById('root'))
console.log(root);
// 把element虚拟dom渲染到容器中
root.render(element);

import { createRoot } from "react-dom/client";
let element = (
    <div>
        <h1>
            hello<span style={{ color: 'red' }}>world</span>
        </h1>
        <h2>
            hello2<span style={{ color: 'green' }}>world2</span>
        </h2>
    </div>
)
console.log(element);
const root = createRoot(document.getElementById('root'))
console.log(root);
// 把element虚拟dom渲染到容器中
root.render(element);

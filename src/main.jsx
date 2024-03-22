import { createRoot } from "react-dom/client";
// let element = (
//     <h1 id="container">
//         hello<span style={{ color: 'red' }}>world</span>
//     </h1>
// )

function FunctionComponent() {
    return (
        <h1
            onClick={(event) => console.log('父冒泡', event.currentTarget)}
            onClickCapture={(event) => console.log('父捕获', event.currentTarget)}
        >
            <span
                onClick={(event) => {
                    console.log('子冒泡', event.currentTarget);
                    event.stopPropagation();
                }}
                onClickCapture={(event) => console.log('子捕获', event.currentTarget)}
            >
                hello world</span>
        </h1>
    )
}
let element = <FunctionComponent />;
console.log(element);
const root = createRoot(document.getElementById('root'));
console.log(root);
// 把element虚拟dom渲染到容器中
root.render(element);

# yc-web







## 3. js

js中创建对象的方式

```javascript
//第一种创建对象的方法
        let o = new Object();
        o.name = 'navy';
        o['age'] = 24;
        console.log(o.name + ':' + o['age']);
        //第二种
        let o2 = {};
        o2.name = 'navy';
        o2['age'] = 18;
        console.log(o2.age + ':' + o2.name)
        //第三种，类似于map
        let o3 = {
            name: 'navy',
            age: 24,
            eat: function () {
                console.log('吃饭饭')
            }
        };
        console.log(o3.age + ':' + o3.name)
        //第四种：使用函数创建一个类
        let oo = function () {
        }
        let o4 = new oo();
        o4.name = 'navy';
        o4['age'] = 18;

        //加入in运算符 可以迭代一个对象中的所有成员
        for (let elemet in o3) {
            console.log('--------------'+elemet)
            console.log(elemet + ":" + o3[elemet])
            if (elemet === 'eat') {
                eval("(" + o3[elemet] + ")()");//使用eval函数激活字符串
            }
        console.log(elemet)
        }
```


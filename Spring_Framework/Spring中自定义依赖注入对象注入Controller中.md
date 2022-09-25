# Spring中自定义依赖注入对象注入Controller中，解决用户鉴权问题

通常我们在写Controller的时候对需要对调用参数的用户进行权限校验，并获取这个用户的信息，一般在用户登录之后的请求中都会携带一个token，我们会在Controller方法被调用前的拦截器中对用户进行鉴权，我们只需要实现`HandlerInterceptorAdapter`接口即可，并通过查缓存获取用户的信息，之后存到当前线程的对象中，通过`LocalThread`就可以拿到这个用户的信息，或者自己封装一个工具类，类似于：

```java
/**
 * 获取自己信息
 */
@GetMapping({"/userInfo","/consumerInfomation"})
public ResponseEntity<ChaUser> userInfo() {
    return ResponseEntity.ok(LocalThreadUtils.getObj());
}
```

这样的好处是把统一的鉴权逻辑在拦截器中处理完毕了，业务层只需要关心业务即可

但是这种方式不是很优雅，并且在实际开发中有的同学会在`Service`层或`dao`层也乱用`LocalThreadUtils.getObj()`的这个方法，这就导致如果在`controller`或者`Service`层开启了一个异步操作，或者是通过`RPC`的方式调用其他模块的接口，就会导致拿不到这个用户的信息，所以我们希望能过通过依赖注入的方式将当前调用这个接口的对象注入到`controller`中，类似于：

```java
/**
 * 获取自己信息
 */
@GetMapping({"/userInfo", "/consumerInfomation"})
public ResponseEntity<ChaUser> userInfo(@User ChaUser user) {
    return ResponseEntity.ok(user);
}
```

那这个怎么实现呢？其实也很简单，因为我们能想到的其实`Spring`都已经给我们提供好了，有一个接口`HandlerMethodArgumentResolver`，我们通常把它称为：`参数解析器`，我们只需要实现这个接口，就能拥有一个自己的依赖注入能力，再将我们自己的解析器交给Spring容器即可

我们先来看一下这个接口：

```java
public interface HandlerMethodArgumentResolver {
    // 判断Controller层中的参数，是否满足条件，满足条件则执行resolveArgument方法，不满足则跳过
    boolean supportsParameter(MethodParameter var1);
    // 用户自定义业务逻辑，并返回自己需要注入的实例，其中webRequest就是本次请求的servlet对象
    Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer, NativeWebRequest webRequest, WebDataBinderFactory binderFactory) throws Exception;
}
```

详细参数可以在源码的注释中看的非常清楚，所以现在我们只需要实现一个自己的`UserHandlerMethodArgumentResolver`，当然Spring默认提供了26种参数解析器，比如我们最常用的参数注解 `@RequestParam` 就是由 `RequestParamMethodArgumentResolver `解析的，`PathVariableMethodArgumentResolver `用来解析 `@PathVariable` 注解

我们先定义一个实体类`ChaUser`：

```java
@Data
@Accessors(chain = true)
public class ChaUser {
    private String userName;
    private Integer age;
    private String emailNumber;
}
```

定义一个注解`@User`，用来标记需要解析的bean：

```java
/**
 * 用来标记当前对象应该从用户上下文中拿到，并注入到controller的方法参数中
 *
 * @author Eureka
 * @since  2022年9月22日19:43:07
 * @see ChaUser
 * @see HandlerMethodArgumentResolver
 * @see UserHandlerMethodArgumentResolver
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface User {
}
```

再定义我们自己的参数解析器`UserHandlerMethodArgumentResolver`：

```java
@Component
public class UserHandlerMethodArgumentResolver implements HandlerMethodArgumentResolver {
    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        // 当参数上有@comment时才使用该解析器解析
        return parameter.hasParameterAnnotation(User.class);
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer, NativeWebRequest webRequest, WebDataBinderFactory binderFactory) throws Exception {
        // 在这里注入当前用户的信息，webRequest中就可以取到用户的请求信息
        return new ChaUser().setUserName("张三").setAge(18).setEmailNumber("xxx@xxx.com");
    }
}
```

但是这样还不行，我们还需要将这个`参数解析器`加入到spring中，我们可以实现一个接口`WebMvcConfigurer#addArgumentResolvers`

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Autowired
    private UserHandlerMethodArgumentResolver userHandlerMethodArgumentResolver;

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        // 添加自己的拦截器
        resolvers.add(userHandlerMethodArgumentResolver);
    }
}
```

可以看到`List<HandlerMethodArgumentResolver>`里面存放的就是spring中所有的`参数解析器`了，我们只需要添加我们自己的就会在对应的容器生命周期过程中也处理我们自己的解析请求

我们写一个测试类测试一下

```java
/**
 * 获取自己信息
 */
@GetMapping({"/userInfo", "/consumerInfomation"})
public ResponseEntity<ChaUser> userInfo(@User ChaUser user) {
    return ResponseEntity.ok(user);
}
```

![image-20220925160647403](https://cdn.fengxianhub.top/resources-master/202209251606615.png)

可以说是非常的方便，这也是为什么Spring这么流行的原因，它留下了非常多的拓展点，只要我们能想到的，一般都会有对应的接口可以满足我们的需求
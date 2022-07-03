# DIY dbUtils



## 1. DBhelper

```java
package com.fx.commons;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.sql.*;
import java.util.*;
import java.util.stream.Collectors;

public class DBhelper {
    //驱动加载
    static {
        try {
            Class.forName(MyProperties.getInstance().getProperty("driver_name"));
        } catch (ClassNotFoundException e) {
            System.out.println("驱动注册失败" + e.getMessage());//项目上线需删除此行
            e.printStackTrace();
        }
    }

    //全局变量
    private Connection conn;
    private Statement stmt;
    private PreparedStatement pstmt;
    private ResultSet rs;

    /**
     * 获取连接对象
     */
    public Connection getConn() {
        try {
            //conn = DriverManager.getConnection("jdbc:oracle:thin:@localhost:1521:orcl","scott","a");
            //不可用system sys==》管理                                数据库服务器所在的地址
            Properties p = MyProperties.getInstance();
            conn = DriverManager.getConnection(p.getProperty("url"), p);
        } catch (SQLException e) {
            System.out.println("获取连接对象失败：" + e.getMessage());
            e.printStackTrace();
        }
        return conn;
    }

    public Statement getStmt() {
        try {
            stmt = conn.createStatement();
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return stmt;
    }

    /**
     * 关闭所有资源型
     */
    public void closeAll(Connection conn, PreparedStatement pstmt, ResultSet rs) {
        if (conn != null) {
            try {
                conn.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
        if (rs != null) {
            try {
                rs.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
        if (pstmt != null) {
            try {
                pstmt.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }

    /**
     * 设置参数
     */
    public void setParams(PreparedStatement pstmt, Object... params) throws Exception {
        if (params == null || params.length <= 0) {
            return;
        }

        //循环数组
        for (int i = 0; i < params.length; i++) {
            pstmt.setObject(i + 1, params[i]);
        }
    }

    /**
     * 更新 ：单条sql语句更新
     */
    public int update(String sql, Object... params) throws Exception {
        int result = 0;
        try {
            conn = getConn();
            pstmt = conn.prepareStatement(sql);
            setParams(pstmt, params);
            //更新
            result = pstmt.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
            System.out.println("单条更新异常：" + e.getMessage());
        } finally {
            closeAll(conn, pstmt, null);
        }
        return result;
    }

    /**
     * Connection对象处于自动提交状态下，意味着执行每个语句后都会自动提交更改
     * 若禁用了自动提交模式，那么要提交更改就必须显示调用commit方法，否则无法保存数据库更新
     * <p>
     * 带了事务的更新操作    多条更新sql语句
     *
     * @param params 小list语句顺序必须和sql语句一致    小list集合中参数顺序必须与对应的sql语句?一致
     * @return 1表示成功<br>其他失败
     */
    public int update(List<String> sqls, List<List<Object>> params) throws Exception {
        int result = 0;
        try {
            conn = getConn();
            //将事务设为手动处理
            conn.setAutoCommit(false);
            //循环所有的sql语句
            for (int i = 0; i < sqls.size(); i++) {
                //获取单条sql语句
                String sql = sqls.get(i);
                //获取与sql语句对应位置的参数设置List
                List<Object> param = params.get(i);
                pstmt = conn.prepareStatement(sql);
                //设置参数
                setParams(pstmt, param.toArray());//将集合转为对象数组
                result = pstmt.executeUpdate();
                if (result <= 0) {
                    //更新受影响的函数认为更新失败，撤销前面所有的操作
                    conn.rollback();
                    return result;
                }
            }
            //执行成功——手动提交事务
            conn.commit();
        } catch (SQLException e) {
            //事务回滚
            conn.rollback();
            result = 0;
            e.printStackTrace();
            System.out.println("多条更新异常：" + e.getMessage());
        } finally {
            //事务还原
            conn.setAutoCommit(true);
            closeAll(conn, pstmt, null);
        }
        return result;
    }

    /**
     * 通过指定的map返回对应的Class实例
     */
    private <T> T parseMapToT(Class<T> cls, Map<String, Object> map) throws InvocationTargetException, IllegalAccessException, InstantiationException {
        T t = cls.newInstance();
        List<Method> setMethods = getAllSetMethod(cls);
        //4. 激活指定的方法往JavaBean中存入值
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue().toString();
            for (Method m : setMethods) {
                if (m.getName().equalsIgnoreCase("set" + key)) {
                    //取出方法中的参数类型
                    String typeName = m.getParameterTypes()[0].getTypeName();
                    if ("int".equalsIgnoreCase(typeName) || "java.lang.Integer".equalsIgnoreCase(typeName)) {
                        m.invoke(t, Integer.parseInt(value));
                    } else if ("long".equalsIgnoreCase(typeName) || "java.lang.Long".equalsIgnoreCase(typeName)) {
                        m.invoke(t, Long.parseLong(value));
                    } else if ("float".equalsIgnoreCase(typeName) || "java.lang.Float".equalsIgnoreCase(typeName)) {
                        m.invoke(t, Float.parseFloat(value));
                    } else if ("double".equalsIgnoreCase(typeName) || "java.lang.Double".equalsIgnoreCase(typeName)) {
                        m.invoke(t, Double.parseDouble(value));
                    } else if ("boolean".equalsIgnoreCase(typeName) || "java.lang.Boolean".equalsIgnoreCase(typeName)) {
                        m.invoke(t, Boolean.parseBoolean(value));
                    } else {
                        //其他都当做String类型来处理
                        m.invoke(t, value);
                    }
                    //轮循一遍后退出
                    break;
                }
            }
        }
        return t;
    }


    public <T> T findSingle(Class<T> cls,String sql,Object...params) throws Exception {
        Map<String, Object> map = findSingle(sql, params);
        return parseMapToT(cls, map);
    }

    /**
     * 查询操作  返回一条记录
     */
    public Map<String, Object> findSingle(String sql, Object... params) throws Exception {
        Map<String, Object> map = null;
        try {
            conn = getConn();
            pstmt = conn.prepareStatement(sql);
            setParams(pstmt, params);
            //返回结果集对象
            rs = pstmt.executeQuery();
            //获取所有的列名
            List<String> columnNames = getColumnNames(rs);
            if (rs.next()) {
                map = new HashMap<>();
                for (String name : columnNames) {
                    //根据名称获取值
                    Object obj = rs.getObject(name);
                    if (obj == null) continue;
                    //获取当前值的数据类型
                    String typeName = obj.getClass().getName();
                    map.put(name, rs.getObject(name));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
            System.out.println("单条查询异常：" + e.getMessage());
        } finally {
            closeAll(conn, pstmt, rs);
        }
        return map;
    }

    /**
     * 将sql语句返回的多条结果转换成Bean对象集合返回
     */
    public <T> List<T> findMultiple(Class<T> cls,String sql,Object...params) throws Exception {
        //首先要得到每条sql语句执行后得到的map
        List<Map<String, Object>> list = findMultiple(sql, params);
        return list.stream()
                .map(e -> {
                    try {
                        return parseMapToT(cls, e);
                    } catch (InvocationTargetException | InstantiationException | IllegalAccessException invocationTargetException) {
                        invocationTargetException.printStackTrace();
                    }
                    return null;
                })
                .collect(Collectors.toList());
    }

    /**
     * 查询返回多条记录
     */
    public List<Map<String, Object>> findMultiple(String sql, Object... params) throws Exception {
        Map<String, Object> map;
        List<Map<String, Object>> list = new ArrayList<>();
        try {
            conn = getConn();
            pstmt = conn.prepareStatement(sql);
            setParams(pstmt, params);
            rs = pstmt.executeQuery();
            List<String> columnNames = getColumnNames(rs);
            //System.out.println(columnNames);

            //多条数据
            while (rs.next()) {
                map = new HashMap<>();
                for (String name : columnNames) {
                    //根据名称获取值
                    Object obj = rs.getObject(name);
                    if (obj == null) continue;
                    //获取当前值的数据类型
                    String typeName = obj.getClass().getName();
                    map.put(name, rs.getObject(name));
                }
                list.add(map);
            }
        } catch (SQLException e) {
            e.printStackTrace();
            System.out.println("单条查询异常：" + e.getMessage());
        } finally {
            closeAll(conn, pstmt, rs);
        }
        return list;
    }

    /**
     * 聚合函数查询  单个聚合函数 select count(*) from 表名
     */
    public double getPloymer(String sql, Object... params) throws Exception {
        double result = 0;
        try {
            conn = getConn();
            pstmt = conn.prepareStatement(sql);
            setParams(pstmt, params);
            rs = pstmt.executeQuery();
            if (rs.next()) {
                result = rs.getDouble(1);
                //double 的形式获取此 ResultSet 对象的当前行中指定列的值   列1
            }
        } catch (SQLException e) {
            e.printStackTrace();
            throw new Exception("聚合函数查询失败：" + e.getMessage());
        } finally {
            closeAll(conn, pstmt, rs);
        }
        return result;
    }

    /**
     * 根据结果集获取所有列名
     */
    public List<String> getColumnNames(ResultSet rs) throws SQLException {
        List<String> columnNames = new ArrayList<String>();
        //通过结果集对象获取结果集所有的列及属性
        ResultSetMetaData data = rs.getMetaData();
        // 获取此 ResultSet 对象的列的编号、类型和属性
        int count = data.getColumnCount();//根据sql语句查看列的条数
        //System.out.println(count);
        //列的编号从1开始
        for (int i = 1; i <= count; i++) {
            columnNames.add(data.getColumnName(i));
        }
        //System.out.println(columnNames);
        return columnNames;

    }


    /**
     * 取出所有的set方法
     */
    private List<Method> getAllSetMethod(Class cls) {
        List<Method> setMethods = new ArrayList<>();
        Method[] methods = cls.getMethods();
        for (Method m : methods) {
            if (m.getName().startsWith("set")) {
                setMethods.add(m);
            }
        }
        return setMethods;
    }

}

```



## 2. Properties

```java
package com.fx.commons;

import java.io.IOException;
import java.util.Properties;

/**
 * 单例设计模式 继承Properties
 */
public class MyProperties extends Properties {
	private static final MyProperties instance = new MyProperties();

	private MyProperties() {
		try {
			// 注意文件路径 此时文件直接存放在src目录下 如果在com.yc.commons包中 com/yc/commons/db.properties
			this.load(this.getClass().getClassLoader().getResourceAsStream("com/fx/commons/db.properties"));
		} catch (IOException e) {
			System.out.println("配置文件加载失败：" + e.getMessage());
			e.printStackTrace();
		}
	}

	public static MyProperties getInstance() {
//		System.out.println(instance.getProperty("driver_name"));
//		System.out.println(instance.getProperty("user"));
//		System.out.println(instance.getProperty("url"));
//		System.out.println(instance.getProperty("password"));
		return instance;
	}
}

```



## 3. db.properties

```properties
driver_name=com.mysql.cj.jdbc.Driver
url=jdbc:mysql://localhost:3306/iot?useUnicode=true&characterEncoding=utf-8&useSSL=false&serverTimezone=Asia/Shanghai
user=xxxxxx
password=xxxxxx
```




我们需要在jshint基础上实现如下功能。

jshint提供的功能:静态检查单一文件

我们需要实现：

文件夹所有代码检查。html文件可以只检查<script></script>中的内容

支持自定义检查，作为nodejs模块

生成json文件，生成报表,报表模版生成

报表名称支持读取version文件

只检查指定后缀，后缀可配置。

统一配置文件，只需要一个配置文件，而且最好是json



优先级从上到下依次降低。优先实现前面的功能。



node baiduhunter.js  -s /folder


find ../huntermodules/ -maxdepth 1 -name "*"  -exec node baiduhunter -s '{}' \;

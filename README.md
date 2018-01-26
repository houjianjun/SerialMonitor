# SerialMonitor

编写的一个arduino串口数据发送工具
因为要做web串口通信，考虑到用户体验，不想使用dll插件与node，因为两者都需用户安装配置。
所以使用chrome app方式写了一个小工具。
## 使用时需先将，以下代码写入到arduino板子中：
String comdata = "";

void setup() {
  Serial.begin(9600);
  while(Serial.read()>= 0){} //clear serialbuffer
}

void loop() {
  // read data from serial port
  if(Serial.available()>0){
      delay(100);
      comdata = Serial.readString();
      Serial.print("readString:");
      Serial.println(comdata);
    }
    comdata = "";
}
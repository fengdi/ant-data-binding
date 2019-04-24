




//简易类型判断
// from:https://github.com/fengdi/imjs/blob/master/im-dev.js#L244
 const type = function (obj, type) {
    var ts = {}.toString,
      ud = void 0,
      t = obj === null ? 'null' :
        (obj === ud && 'undefined' || ts.call(obj).slice(8, -1).toLowerCase());
    return type ? t === type : t;
  }
  
  //两个变量是否相等，引用类型根据json判断，所以仅支持能转为JSON的数据判断
  //bug：is_equal({b:"1",a:"1"}, {a:"1",b:"1"}); //键顺序不一致 为false
 const is_equal = (a, b) => {
  
    const simpleTypes = ["undefined", "number", "boolean", "null", "string"];//基本类型
  
    //console.log(a, b, a === b, JSON.stringify(a) === JSON.stringify(b));
  
    if ((simpleTypes.indexOf(type(a)) != -1 || simpleTypes.indexOf(type(b)) != -1) && (!isNaN(a) || !isNaN(b))) {
      return a === b;
    } else {
      return JSON.stringify(a) === JSON.stringify(b);
    }
  
};


  
  /**
   * 表单双向绑定state
   * @param {Component} Comp 组件
   * 用法和.Form.create完全一样，不用关心内部，表单字段变化会自动更新同名的state
   
   例如：
   <FormItem label="foo字段">
      {getFieldDecorator('foo', {
          initialValue: state.foo,
          rules: [{ required: true, message: 'foo必填' }],
      })(
          <Ant.Input placeholder="" />
      )}
  </FormItem>
  
    此字段和state.foo就自动绑定了，
    {state.foo} - {getFieldValue('foo')} //数据自动同步且等效
  
  
   * 此方法依赖：is_equal, React.Component,  Ant.Form.create
   */
  let _uid = 1;
  module.exports = ( Comp => { //CreateFormBindState
    // return Ant.Form.create()(Comp);
  
    let fns = []; //存储所有监听的函数
  
    //简易事件处理方法
    //onFieldsChange(function(){}, key)  //添加监听函数
    //onFieldsChange({data:...}, key)    //触发执行所有监听函数并传入参数
    //onFieldsChange(null, key)          //由于方式2不存在null情况，因此传null清除所有监听函数
    const onFieldsChange = function (changes, key) {
      if (typeof changes === "function") {
        changes._key = key;
        fns.push(changes);
      } else if (changes === null) {
        if (arguments.length == 2) {
          fns = fns.filter(fn => fn._key != key);
        } else {
          fns = [];
        }
      } else {
        for (let index = 0; index < fns.length; index++) {
          if (arguments.length == 2) {
            if (fns[index]._key === key) {
              fns[index].call(null, changes);
            }
          } else {
            fns[index].call(null, changes);
          }
        }
      }
    };
  
    //切片编程，替换 componentDidMount componentWillUnmount setState componentWillUpdate
  
    //hook componentDidMount
    const _componentDidMount = Comp.prototype.componentDidMount || function () { };
  
    Comp.prototype.componentDidMount = function () {
      const self = this;
      const { formKey: key } = self.props;
      const { state } = self;
      // const { onFieldsChange } = self.props;
      //监听表单字段变更事件，更新state 完成双向绑定
      //（更新state本身会触发视图更新）
      onFieldsChange(changes => {
        let c = {};
        for (const name in changes) {
          if (changes.hasOwnProperty(name)) {
            if (!is_equal(changes[name].value, state[name])) {
              c[name] = changes[name].value;
            }
          }
        }
        self.setState(c);
      }, key);
      _componentDidMount.apply(self, arguments);
    };
  
    //hook componentWillUnmount
    // const _componentWillUnmount = Comp.prototype.componentWillUnmount || function(){};
    // Comp.prototype.componentWillUnmount = function(){
    //   _componentWillUnmount.apply(this, arguments);
    //   this.setState = ()=>{};
    // }
  
    //hook componentWillUpdate
    // const _componentWillUpdate = Comp.prototype.componentWillUpdate || function(){};
    // Comp.prototype.componentWillUpdate = function(nextProps, nextState){
    //   const { form } = this.props;
    //   const { setFieldsValue, getFieldsValue } = form;
    //   let fields = getFieldsValue();
  
    //   let setData = {}
    //   for (const key in nextState) {
    //     if (nextState.hasOwnProperty(key) && fields.hasOwnProperty(key)) {
    //       if(fields[key] != nextState[key]){
    //         setData[key] = nextState[key]
    //       }
    //     }
    //   }
    //   if(Object.keys(setData).length){
    //     setFieldsValue(setData);
    //   }
    //   _componentWillUpdate.apply(this, arguments);
    // }
  
    //hook setState
    const _setState = Comp.prototype.setState || function () { };
    Comp.prototype.setState = function (nextState) {
      const { form } = this.props;
      const { setFieldsValue, getFieldsValue } = form;
      let fields = getFieldsValue();
  
      let setData = {};
      for (const key in nextState) {
        if (nextState.hasOwnProperty(key) && fields.hasOwnProperty(key)) {
          if (!is_equal(nextState[key], fields[key])) {
            setData[key] = nextState[key];
          }
        }
      }
      if (Object.keys(setData).length) {
        setFieldsValue(setData);
      }
      _setState.apply(this, arguments);
    };
  
    const ExtComp = Ant.Form.create({
      onFieldsChange(props, changedValues) {
        // console.log(props);
        //事件双向绑定
        onFieldsChange(changedValues, props.formKey);
      }
    })(Comp);
  
    //本来可以直接返回ExtComp组件，
    //但为了每个实例formKey唯一，所以包装了一次ExtForm，构造函数里面创建唯一id
    return class ExtForm extends Component {
      constructor(props) {
        super(props);
        this._uid = _uid++;
      }
      render() {
        const { props } = this;
        return <ExtComp {...props} formKey={this._uid} />;
      }
    };
  });
  
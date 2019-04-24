
import { CreateFormBindState } from "./index.js";
class Page extends Component{

    constructor(props){
        super(props)
        this.state = {
            foo: "hello"
        }
    }

    render(){
        const state = this.state;
        const { form } = this.props;
        const {
            getFieldDecorator,
            getFieldValue
        } = form;

        return (
            <div>
                数据打印，等效：<br/>
                state.foo : {state.foo}  -  getFieldValue('foo')：{getFieldValue('foo')}

                    <Ant.Form  >

                        <Ant.Form.Item label="foo字段">
                            {getFieldDecorator('foo', {
                                initialValue: state.foo,
                                rules: [{ required: true, message: 'foo必填' }],
                            })(
                                <Ant.Input placeholder="" />
                            )}
                        </Ant.Form.Item>

                    </Ant.Form>

            </div>
        )
    }
}

//CreateFormBindState 可以看做是 Form.create，只是内部对组件实现了字段和state更新
export default CreateFormBindState(Page);
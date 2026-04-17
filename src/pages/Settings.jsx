import React from 'react';
import { Layout, Card, Typography, Empty } from 'antd';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

const Settings = () => {
  return (
    <Layout style={{ padding: '24px' }}>
      <Content>
        <Card>
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Empty
              description={
                <div>
                  <Title level={3} style={{ marginBottom: 16 }}>
                    系统设置模块
                  </Title>
                  <Paragraph type="secondary">
                    暂未想好此模块的功能，后续开发中...
                  </Paragraph>
                </div>
              }
            />
          </div>
        </Card>
      </Content>
    </Layout>
  );
};

export default Settings;

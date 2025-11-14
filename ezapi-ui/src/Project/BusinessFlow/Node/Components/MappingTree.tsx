import { AddCircleOutlineRounded, RemoveCircleOutline } from '@material-ui/icons';
import { TreeItem, TreeView } from '@material-ui/lab';
import { ArrowCircleLeft, ArrowCircleRight } from '@mui/icons-material';
import { InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { TreeNode } from '../../interfaces';

interface MappingTreeProps {
    data: TreeNode[] | TreeNode;
    isCurrentNode?: boolean;
    onSelect: Function;
    disable?: boolean;
}

export const MappingTree = ({ data, isCurrentNode = true, onSelect = () => {}, disable = false }: MappingTreeProps) => {
    const [selectedItem, setSelectedItem] = useState('');
    const [selectedNode, setSelectedNode] = useState<TreeNode>();

    const renderTree = (nodes: TreeNode) => (
        <TreeItem
            key={nodes.id}
            nodeId={nodes.id}
            onClick={() => {
                if (nodes.name !== 'parent') {
                    setSelectedNode(nodes);
                    setSelectedItem(nodes.name);
                }
            }}
            label={
                <Typography
                    sx={{
                        fontFamily: 'Inter',
                        color: nodes.children.length > 0 || nodes.name === 'parent' ? '#007AFF' : '#3C4858',
                        fontWeight: 600,
                        lineHeight: '36px',
                    }}
                >
                    {nodes.name}
                </Typography>
            }
        >
            {Array.isArray(nodes.children) ? nodes.children.map((node) => renderTree(node)) : null}
        </TreeItem>
    );

    return (
        <Stack
            sx={{
                border: '1px solid #C0CCDA',
                borderRadius: '1%',
                overflowX: 'none',
                padding: '12px 12px',
                height: '72vh',
            }}
            justifyContent={'space-between'}
        >
            <Stack sx={{ overflowY: 'auto' }}>
                {Array.isArray(data) ? (
                    data.map((treeData) => (
                        <TreeView
                            aria-label="rich object"
                            defaultCollapseIcon={<RemoveCircleOutline style={{ color: '#007AFF' }} />}
                            defaultExpanded={['root', 'parent-root']}
                            defaultExpandIcon={<AddCircleOutlineRounded style={{ color: '#007AFF' }} />}
                            // @ts-ignore
                            sx={{ flexGrow: 1, maxWidth: 400, overflowY: 'auto' }}
                        >
                            {renderTree(treeData)}
                        </TreeView>
                    ))
                ) : (
                    <TreeView
                        aria-label="rich object"
                        defaultCollapseIcon={<RemoveCircleOutline style={{ color: '#007AFF' }} />}
                        defaultExpanded={['root', 'parent-root']}
                        defaultExpandIcon={<AddCircleOutlineRounded style={{ color: '#007AFF' }} />}
                        // @ts-ignore
                        sx={{ flexGrow: 1, maxWidth: 400, overflowY: 'auto' }}
                    >
                        {renderTree(data)}
                    </TreeView>
                )}
            </Stack>
            <TextField
                variant="outlined"
                InputProps={
                    isCurrentNode
                        ? {
                              endAdornment: (
                                  <InputAdornment
                                      position="end"
                                      sx={{ cursor: disable ? 'arrow' : 'pointer' }}
                                      onClick={() => {
                                          if (selectedNode && !disable) {
                                              console.log(selectedNode);

                                              onSelect(selectedNode);
                                              setSelectedItem('');
                                          }
                                      }}
                                  >
                                      <ArrowCircleRight color={disable ? 'disabled' : 'primary'} />
                                  </InputAdornment>
                              ),
                          }
                        : {
                              startAdornment: (
                                  <InputAdornment
                                      position="start"
                                      sx={{ cursor: disable ? 'arrow' : 'pointer' }}
                                      onClick={() => {
                                          if (selectedNode && !disable) {
                                              console.log(selectedNode);
                                              onSelect(selectedNode);
                                              setSelectedItem('');
                                          }
                                      }}
                                  >
                                      <ArrowCircleLeft color={disable ? 'disabled' : 'primary'} />
                                  </InputAdornment>
                              ),
                              //   sx: {
                              //       '& input': {
                              //           textAlign: 'left',
                              //       },
                              //   },
                          }
                }
                value={selectedItem}
            />
        </Stack>
    );
};
